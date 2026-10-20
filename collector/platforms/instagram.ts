// Instagram: актор Apify «apify/instagram-scraper», посты профилей начиная с даты старта.
// Берём только видео (Reels). Поля ответа проверить при первом запуске — Apify иногда их меняет.
// Профили, по которым посты не пришли, добираем через вкладку Reels («apify/instagram-reel-scraper»).
import { chunk, runActor } from "../apify";
import type { CollectedVideo, PlatformCollector } from "../types";

const ACTOR = process.env.APIFY_INSTAGRAM_ACTOR || "apify/instagram-scraper";
const REEL_ACTOR = process.env.APIFY_INSTAGRAM_REEL_ACTOR || "apify/instagram-reel-scraper";

type Item = {
  id?: string; shortCode?: string; url?: string; caption?: string; timestamp?: string; type?: string;
  productType?: string; videoPlayCount?: number; videoViewCount?: number; ownerUsername?: string;
};

function toVideo(it: Item, reelsOnly: boolean): CollectedVideo | null {
  const isVideo = reelsOnly || it.type === "Video" || it.productType === "clips";
  if (!isVideo || !it.shortCode || !it.timestamp || !it.ownerUsername) return null;
  return {
    platform: "instagram",
    handle: it.ownerUsername,
    externalId: it.shortCode,
    url: it.url || `https://www.instagram.com/reel/${it.shortCode}/`,
    caption: it.caption ?? "",
    publishedAt: it.timestamp,
    views: it.videoPlayCount ?? it.videoViewCount ?? 0,
  };
}

export const collectInstagram: PlatformCollector = async (accounts, since) => {
  const out: CollectedVideo[] = [];
  for (const batch of chunk(accounts, 50)) {
    const items = await runActor<Item>(ACTOR, {
      directUrls: batch.map((a) => `https://www.instagram.com/${a.handle}/`),
      resultsType: "posts",
      resultsLimit: 500,
      onlyPostsNewerThan: since,
      addParentData: false,
    });
    for (const it of items) {
      const v = toVideo(it, false);
      if (v) out.push(v);
    }
  }

  const got = new Set(out.map((v) => v.handle.toLowerCase()));
  const empty = accounts.filter((a) => !got.has(a.handle.toLowerCase()));
  if (empty.length) {
    try {
      const items = await runActor<Item>(REEL_ACTOR, { username: empty.map((a) => a.handle), resultsLimit: 500, onlyPostsNewerThan: since });
      for (const it of items) {
        const v = toVideo(it, true);
        if (v && v.publishedAt.slice(0, 10) >= since) out.push(v);
      }
    } catch (e) {
      console.warn(`Instagram Reels: ${(e as Error).message.slice(0, 200)}`);
    }
  }
  return out;
};
