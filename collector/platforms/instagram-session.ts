// Instagram через вход в аккаунт: веб-API Instagram с cookie sessionid (секрет IG_SESSION_ID).
// Без входа Instagram отдаёт только часть роликов профиля, поэтому аккаунты с игрой добираем так.
// Запросы идут по одному с паузой, чтобы Instagram не счёл аккаунт ботом.
import type { CollectedVideo, SheetAccount } from "../types";

const BASE = "https://www.instagram.com/api/v1";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

type FeedItem = {
  code?: string; taken_at?: number; media_type?: number; product_type?: string;
  play_count?: number; ig_play_count?: number; view_count?: number;
  caption?: { text?: string } | null; user?: { username?: string };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ig<T>(path: string, session: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      cookie: `sessionid=${session}`,
      "user-agent": UA,
      "x-ig-app-id": "936619743392459",
      "x-requested-with": "XMLHttpRequest",
      referer: "https://www.instagram.com/",
    },
  });
  const text = await res.text();
  if (!res.ok || text.startsWith("<")) throw new Error(`${path}: ${res.status} ${text.slice(0, 150)}`);
  return JSON.parse(text) as T;
}

export async function collectInstagramSession(accounts: SheetAccount[], since: string, session: string): Promise<CollectedVideo[]> {
  const out: CollectedVideo[] = [];
  const sinceTs = Date.parse(since) / 1000;
  for (const a of accounts) {
    try {
      const prof = await ig<{ data?: { user?: { id?: string } } }>(`/users/web_profile_info/?username=${encodeURIComponent(a.handle)}`, session);
      const id = prof.data?.user?.id;
      if (!id) throw new Error("профиль не найден");
      let maxId = "";
      let n = 0;
      for (let page = 0; page < 20; page++) {
        await sleep(1500);
        const feed = await ig<{ items?: FeedItem[]; more_available?: boolean; next_max_id?: string }>(
          `/feed/user/${id}/?count=33${maxId ? `&max_id=${maxId}` : ""}`, session);
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
    }
    await sleep(3000);
  }
  return out;
}
