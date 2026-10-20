// TikTok: актор Apify «clockworks/tiktok-scraper», видео профилей начиная с даты старта.
// Поля ответа проверить при первом запуске.
import { chunk, runActor } from "../apify";
import type { PlatformCollector } from "../types";

const ACTOR = process.env.APIFY_TIKTOK_ACTOR || "clockworks/tiktok-scraper";

type Item = { id?: string; text?: string; createTimeISO?: string; playCount?: number; webVideoUrl?: string; authorMeta?: { name?: string } };

export const collectTikTok: PlatformCollector = async (accounts, since) => {
  const out = [];
  for (const batch of chunk(accounts, 50)) {
    const items = await runActor<Item>(ACTOR, {
      profiles: batch.map((a) => a.handle),
      profileScrapeSections: ["videos"],
      profileSorting: "latest",
      resultsPerPage: 500,
      oldestPostDateUnified: since,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
    });
    for (const it of items) {
      const handle = it.authorMeta?.name;
      if (!it.id || !it.createTimeISO || !handle) continue;
      out.push({
        platform: "tiktok" as const,
        handle,
        externalId: it.id,
        url: it.webVideoUrl || `https://www.tiktok.com/@${handle}/video/${it.id}`,
        caption: it.text ?? "",
        publishedAt: it.createTimeISO,
        views: it.playCount ?? 0,
      });
    }
  }
  return out;
};
