import { getVideos } from "@/lib/db/queries";
import { inRange, mskDate } from "@/lib/dates";
import type { VideoRow } from "@/lib/db/types";
import type { BlockCtx } from "../types";

type Group = { views: number; posts: number; accounts: number };

function summarize(videos: VideoRow[]): Group {
  return {
    views: videos.reduce((a, v) => a + v.views, 0),
    posts: videos.length,
    accounts: new Set(videos.map((v) => v.account_id)).size,
  };
}

// Ролики, опубликованные в выбранном периоде, с их текущими просмотрами.
export async function getCreatorsData({ campaign, range }: BlockCtx) {
  const videos = (await getVideos(campaign.id)).filter((v) => inRange(mskDate(v.published_at), range.from, range.to));
  const creators = videos.filter((v) => v.kind === "creator");
  const publishers = videos.filter((v) => v.kind === "publisher");

  const perPublisher = new Map<string, { handle: string; name: string | null; views: number; posts: number }>();
  for (const v of publishers) {
    const row = perPublisher.get(v.account_id) ?? { handle: v.handle, name: v.full_name, views: 0, posts: 0 };
    row.views += v.views;
    row.posts += 1;
    perPublisher.set(v.account_id, row);
  }

  return {
    creators: summarize(creators),
    publishers: summarize(publishers),
    total: summarize(videos),
    publisherRows: [...perPublisher.values()].sort((a, b) => b.views - a.views),
  };
}
