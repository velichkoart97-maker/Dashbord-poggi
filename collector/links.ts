// Отдельные ролики из второй Google Таблицы (например, отчёт о заливах: дата, ссылка на ролик, кто залил).
// Ролик собирается по ссылке, его аккаунт добавляется в кампанию автоматически (без сбора всего профиля).
import { platformFromUrl, type PlatformId } from "../src/config/platforms";
import { chunk, runActor } from "./apify";
import { csvExportUrl, parseCsv } from "./sheet";
import type { CollectedVideo, SheetAccount } from "./types";
import { ytApi } from "./platforms/youtube";

type Link = { url: string; platform: PlatformId; fullName: string | null };

export async function readLinks(sheetUrl: string): Promise<Link[]> {
  const res = await fetch(csvExportUrl(sheetUrl), { redirect: "follow" });
  if (!res.ok) throw new Error(`Таблица роликов недоступна (${res.status}). Откройте доступ «Все, у кого есть ссылка».`);
  const rows = parseCsv(await res.text());
  const isUrl = (s: string) => /https?:\/\//i.test(s);
  const header = rows[0] && !rows[0].some(isUrl) ? rows[0].map((h) => h.toLowerCase()) : null;
  const nameCol = header ? header.findIndex((h) => /кто|фио|имя|name/.test(h)) : -1;
  const out: Link[] = [];
  const seen = new Set<string>();
  for (const cells of header ? rows.slice(1) : rows) {
    const url = cells.find(isUrl)?.trim();
    const platform = url ? platformFromUrl(url) : null;
    if (!url || !platform || seen.has(url)) continue;
    seen.add(url);
    const name = nameCol >= 0 ? cells[nameCol]?.trim() : "";
    out.push({ url, platform, fullName: name ? name.replace(/^.*\|\s*/, "") : null }); // «Актёр 1 | Максим» → «Максим»
  }
  return out;
}

// Код ролика из ссылки (для Instagram и YouTube; у коротких ссылок TikTok его нет).
function videoKey(l: Link): string | null {
  const u = new URL(l.url);
  const parts = u.pathname.split("/").filter(Boolean);
  if (l.platform === "instagram") return ["p", "reel", "reels"].includes(parts[0]) ? parts[1] ?? null : null;
  if (l.platform === "youtube") {
    if (u.hostname.includes("youtu.be")) return parts[0] ?? null;
    if (parts[0] === "shorts" || parts[0] === "live") return parts[1] ?? null;
    return u.searchParams.get("v");
  }
  return null;
}

async function instagram(links: Link[]): Promise<CollectedVideo[]> {
  type Item = { shortCode?: string; url?: string; caption?: string; timestamp?: string; type?: string; productType?: string;
    videoPlayCount?: number; videoViewCount?: number; ownerUsername?: string };
  const out: CollectedVideo[] = [];
  const codes = [...new Set(links.map(videoKey).filter((c): c is string => !!c))];
  for (const batch of chunk(codes, 200)) {
    const items = await runActor<Item>(process.env.APIFY_INSTAGRAM_ACTOR || "apify/instagram-scraper", {
      directUrls: batch.map((c) => `https://www.instagram.com/p/${c}/`),
      resultsType: "details",
      resultsLimit: 1,
      addParentData: false,
    });
    for (const it of items) {
      if (!it.shortCode || !it.timestamp || !it.ownerUsername) continue;
      out.push({ platform: "instagram", handle: it.ownerUsername, externalId: it.shortCode,
        url: `https://www.instagram.com/reel/${it.shortCode}/`, caption: it.caption ?? "", publishedAt: it.timestamp,
        views: it.videoPlayCount ?? it.videoViewCount ?? 0 });
    }
  }
  return out;
}

async function tiktok(links: Link[]): Promise<CollectedVideo[]> {
  type Item = { id?: string; text?: string; createTimeISO?: string; playCount?: number; authorMeta?: { name?: string } };
  const out: CollectedVideo[] = [];
  const videoLinks = links.filter((l) => /\/\/(vm|vt)\.tiktok\.com\/|\/video\//.test(l.url));
  for (const batch of chunk(videoLinks, 200)) {
    const items = await runActor<Item>(process.env.APIFY_TIKTOK_ACTOR || "clockworks/tiktok-scraper", {
      postURLs: batch.map((l) => l.url),
      shouldDownloadVideos: false, shouldDownloadCovers: false, shouldDownloadSubtitles: false,
    });
    for (const it of items) {
      const handle = it.authorMeta?.name;
      if (!it.id || !it.createTimeISO || !handle) continue;
      out.push({ platform: "tiktok", handle, externalId: it.id, url: `https://www.tiktok.com/@${handle}/video/${it.id}`,
        caption: it.text ?? "", publishedAt: it.createTimeISO, views: it.playCount ?? 0 });
    }
  }
  return out;
}

async function youtube(links: Link[]): Promise<CollectedVideo[]> {
  const out: CollectedVideo[] = [];
  const ids = [...new Set(links.map(videoKey).filter((c): c is string => !!c))];
  for (const batch of chunk(ids, 50)) {
    const r = await ytApi<{ items: { id: string; snippet: { title: string; publishedAt: string; channelId: string }; statistics: { viewCount?: string } }[] }>(
      "videos", { part: "snippet,statistics", id: batch.join(",") });
    // Ник канала (@handle), чтобы совпасть с аккаунтом из основной таблицы.
    const chIds = [...new Set(r.items.map((v) => v.snippet.channelId))];
    const ch = await ytApi<{ items?: { id: string; snippet: { customUrl?: string } }[] }>("channels", { part: "snippet", id: chIds.join(",") });
    const handleOf = new Map((ch.items ?? []).map((c) => [c.id, c.snippet.customUrl || c.id]));
    for (const v of r.items) {
      out.push({ platform: "youtube", handle: handleOf.get(v.snippet.channelId) ?? v.snippet.channelId, externalId: v.id,
        url: `https://www.youtube.com/watch?v=${v.id}`, caption: v.snippet.title, publishedAt: v.snippet.publishedAt,
        views: Number(v.statistics.viewCount ?? 0) });
    }
  }
  return out;
}

const BY_LINK: Partial<Record<PlatformId, (links: Link[]) => Promise<CollectedVideo[]>>> = { instagram, tiktok, youtube };

function profileUrl(platform: PlatformId, handle: string): string {
  if (platform === "instagram") return `https://www.instagram.com/${handle}/`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${handle}`;
  return handle.startsWith("UC") ? `https://www.youtube.com/channel/${handle}` : `https://www.youtube.com/${handle}`;
}

// Ролики по ссылкам + аккаунты их авторов, которых нет в основной таблице.
export async function collectLinks(links: Link[], known: SheetAccount[], stats: Record<string, unknown>) {
  const videos: CollectedVideo[] = [];
  for (const [platform, collect] of Object.entries(BY_LINK) as [PlatformId, (l: Link[]) => Promise<CollectedVideo[]>][]) {
    const list = links.filter((l) => l.platform === platform);
    if (!list.length) continue;
    try {
      const got = await collect(list);
      stats[`links_${platform}`] = `${got.length} из ${list.length}`;
      videos.push(...got);
    } catch (e) {
      stats[`links_${platform}`] = `ошибка: ${(e as Error).message.slice(0, 200)}`;
      console.error(`links ${platform}:`, e);
    }
  }

  const nameByKey = new Map(links.map((l) => [`${l.platform}:${videoKey(l)}`, l.fullName]));
  const have = new Set(known.map((a) => `${a.platform}:${a.handle.toLowerCase()}`));
  const accounts: SheetAccount[] = [];
  for (const v of videos) {
    const key = `${v.platform}:${v.handle.toLowerCase()}`;
    if (have.has(key)) continue;
    have.add(key);
    accounts.push({ row: null, url: profileUrl(v.platform, v.handle), platform: v.platform, handle: v.handle,
      fullName: nameByKey.get(`${v.platform}:${v.externalId}`) ?? null, kind: "creator", game: null, since: null });
  }
  return { videos, accounts };
}
