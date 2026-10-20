// Instagram через вход в аккаунт: веб-API Instagram с cookie sessionid (секрет IG_SESSION_ID).
// Без входа Instagram отдаёт только часть роликов профиля, поэтому аккаунты с игрой добираем так.
// Запросы идут по одному с паузой, чтобы Instagram не счёл аккаунт ботом, и через домашний прокси Apify
// (группа RESIDENTIAL, один и тот же sticky-адрес): с адресов дата-центра GitHub Instagram отвечает 429.
import { ProxyAgent, fetch, type Dispatcher } from "undici";
import type { CollectedVideo, SheetAccount } from "../types";

const BASE = "https://www.instagram.com/api/v1";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

type FeedItem = {
  code?: string; taken_at?: number; media_type?: number; product_type?: string;
  play_count?: number; ig_play_count?: number; view_count?: number;
  caption?: { text?: string } | null; user?: { username?: string };
};

class RateLimited extends Error { constructor() { super("429: Instagram ограничил запросы"); } }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Пароль прокси Apify берём из аккаунта по APIFY_TOKEN. IG_PROXY=off — ходить напрямую.
async function apifyProxy(): Promise<Dispatcher | undefined> {
  if (process.env.IG_PROXY === "off" || !process.env.APIFY_TOKEN) return undefined;
  const res = await fetch(`https://api.apify.com/v2/users/me?token=${process.env.APIFY_TOKEN}`);
  const password = ((await res.json()) as { data?: { proxy?: { password?: string } } }).data?.proxy?.password;
  if (!password) throw new Error("Apify не вернул пароль прокси");
  const groups = process.env.IG_PROXY_GROUPS || "RESIDENTIAL";
  const country = process.env.IG_PROXY_COUNTRY ? `,country-${process.env.IG_PROXY_COUNTRY}` : "";
  return new ProxyAgent(`http://groups-${groups},session-poggi_ig${country}:${password}@proxy.apify.com:8000`);
}

async function ig<T>(path: string, session: string, dispatcher?: Dispatcher): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    dispatcher,
    headers: {
      cookie: `sessionid=${session}`,
      "user-agent": UA,
      "x-ig-app-id": "936619743392459",
      "x-requested-with": "XMLHttpRequest",
      referer: "https://www.instagram.com/",
    },
  });
  const text = await res.text();
  if (res.status === 429) throw new RateLimited();
  if (!res.ok || text.startsWith("<")) throw new Error(`${path}: ${res.status} ${text.slice(0, 150)}`);
  return JSON.parse(text) as T;
}

export async function collectInstagramSession(accounts: SheetAccount[], since: string, session: string): Promise<CollectedVideo[]> {
  const out: CollectedVideo[] = [];
  const sinceTs = Date.parse(since) / 1000;
  let dispatcher: Dispatcher | undefined;
  try {
    dispatcher = await apifyProxy();
  } catch (e) {
    console.warn(`Instagram (вход): прокси недоступен, сбор через вход пропущен: ${(e as Error).message.slice(0, 200)}`);
    return out;
  }
  for (const a of accounts) {
    try {
      const prof = await ig<{ data?: { user?: { id?: string } } }>(`/users/web_profile_info/?username=${encodeURIComponent(a.handle)}`, session, dispatcher);
      const id = prof.data?.user?.id;
      if (!id) throw new Error("профиль не найден");
      let maxId = "";
      let n = 0;
      for (let page = 0; page < 20; page++) {
        await sleep(1500);
        const feed = await ig<{ items?: FeedItem[]; more_available?: boolean; next_max_id?: string }>(
          `/feed/user/${id}/?count=33${maxId ? `&max_id=${maxId}` : ""}`, session, dispatcher);
        let older = false;
        for (const it of feed.items ?? []) {
          if (!it.code || !it.taken_at) continue;
          if (it.taken_at < sinceTs) { older = true; continue; }
          if (it.media_type !== 2 && it.product_type !== "clips") continue;
          out.push({
            platform: "instagram",
            handle: it.user?.username || a.handle,
            externalId: it.code,
            url: `https://www.instagram.com/reel/${it.code}/`,
            caption: it.caption?.text ?? "",
            publishedAt: new Date(it.taken_at * 1000).toISOString(),
            views: it.play_count ?? it.ig_play_count ?? it.view_count ?? 0,
          });
          n++;
        }
        if (older || !feed.more_available || !feed.next_max_id) break;
        maxId = feed.next_max_id;
      }
      console.log(`Instagram (вход): ${a.handle} — ${n} роликов`);
    } catch (e) {
      console.warn(`Instagram (вход): ${a.handle}: ${(e as Error).message.slice(0, 200)}`);
      // На 429 дальше не стучимся: остальные запросы тоже отобьют, а аккаунт рискует блокировкой.
      if (e instanceof RateLimited) break;
    }
    await sleep(3000);
  }
  return out;
}
