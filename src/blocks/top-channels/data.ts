import { getVideos } from "@/lib/db/queries";
import { inRange, mskDate } from "@/lib/dates";
import type { PlatformId } from "@/config/platforms";
import type { BlockCtx } from "../types";

// Топ-8 аккаунтов по просмотрам роликов, опубликованных в периоде.
export async function getTopChannelsData({ campaign, range }: BlockCtx, limit = 8) {
  const videos = (await getVideos(campaign.id)).filter((v) => inRange(mskDate(v.published_at), range.from, range.to));
  const byAccount = new Map<string, { handle: string; platform: PlatformId; views: number }>();
  for (const v of videos) {
    const row = byAccount.get(v.account_id) ?? { handle: v.handle, platform: v.platform, views: 0 };
    row.views += v.views;
    byAccount.set(v.account_id, row);
  }
  return [...byAccount.values()].sort((a, b) => b.views - a.views).slice(0, limit);
}
