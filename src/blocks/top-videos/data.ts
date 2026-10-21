import { activePlatforms, type PlatformId } from "@/config/platforms";
import { getVideos } from "@/lib/db/queries";
import { mskDate } from "@/lib/dates";
import type { BlockCtx } from "../types";

export type TopVideo = { platform: PlatformId; url: string; caption: string; views: number; date: string };

// Все ролики от 100K просмотров; фильтры по диапазону и периоду — в браузере (TopVideosTable).
export async function getTopVideosData({ campaign }: BlockCtx) {
  const videos = await getVideos(campaign.id);
  const top: TopVideo[] = videos
    .filter((v) => v.views >= 100_000)
    .sort((a, b) => b.views - a.views)
    .map((v) => ({ platform: v.platform, url: v.url, caption: (v.caption ?? "").slice(0, 160), views: v.views, date: mskDate(v.published_at) }));

  return {
    top,
    channels: new Set(videos.map((v) => v.account_id)).size,
    total: videos.length,
    byPlatform: activePlatforms(videos).map((p) => ({ id: p.id, label: p.label, color: p.color, n: videos.filter((v) => v.platform === p.id).length })),
  };
}
