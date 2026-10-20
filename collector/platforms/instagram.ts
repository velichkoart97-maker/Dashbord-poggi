// Instagram: актор Apify «apify/instagram-scraper», посты профилей начиная с даты старта.
// Берём только видео (Reels). Поля ответа проверить при первом запуске — Apify иногда их меняет.
import { chunk, runActor } from "../apify";
import type { PlatformCollector } from "../types";

const ACTOR = process.env.APIFY_INSTAGRAM_ACTOR || "apify/instagram-scraper";

type Item = {
  id?: string; shortCode?: string; url?: string; caption?: string; timestamp?: string; type?: string;
  productType?: string; videoPlayCount?: number; videoViewCount?: number; ownerUsername?: string;
};

export const collectInstagram: PlatformCollector = async (accounts, since) => {
  const out = [];
  for (const batch of chunk(accounts, 50)) {
    const items = await runActor<Item>(ACTOR, {
      directUrls: batch.map((a) => `https://www.instagram.com/${a.handle}/`),
      resultsType: "posts",
      resultsLimit: 500,
      onlyPostsNewerThan: since,
      addParentData: false,
    });
    for (const it of items) {
      const isVideo = it.type === "Video" || it.productType === "clips";
      if (!isVideo || !it.shortCode || !it.timestamp || !it.ownerUsername) continue;
      out.push({
        platform: "instagram" as const,
        handle: it.ownerUsername,
        externalId: it.shortCode,
        url: it.url || `https://www.instagram.com/reel/${it.shortCode}/`,
        caption: it.caption ?? "",
        publishedAt: it.timestamp,
        views: it.videoPlayCount ?? it.videoViewCount ?? 0,
      });
    }
  }
  return out;
};
