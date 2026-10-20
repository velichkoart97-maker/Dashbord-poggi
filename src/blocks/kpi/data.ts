import { PLATFORMS } from "@/config/platforms";
import { getDaily, getVideos } from "@/lib/db/queries";
import { inRange, mskDate } from "@/lib/dates";
import { daysBetween, todayMsk } from "@/lib/period";
import type { BlockCtx } from "../types";

export async function getKpiData({ campaign, range }: BlockCtx) {
  const [daily, videos] = await Promise.all([getDaily(campaign.id), getVideos(campaign.id)]);

  const views = daily.filter((d) => inRange(d.date, range.from, range.to)).reduce((a, d) => a + d.new_views, 0);
  const totalViews = daily.reduce((a, d) => a + d.new_views, 0);

  const periodVideos = videos.filter((v) => inRange(mskDate(v.published_at), range.from, range.to));
  const byPlatform = (count: (pid: string) => number) =>
    PLATFORMS.filter((p) => p.enabled).map((p) => ({ label: p.label, n: count(p.id) }));

  const accounts = new Set(periodVideos.map((v) => v.account_id));

  return {
    views,
    videos: periodVideos.length,
    videosBy: byPlatform((id) => periodVideos.filter((v) => v.platform === id).length),
    channels: accounts.size,
    channelsBy: byPlatform((id) => new Set(periodVideos.filter((v) => v.platform === id).map((v) => v.account_id)).size),
    budget: Number(campaign.budget_usd),
    cpv: totalViews > 0 ? Number(campaign.budget_usd) / totalViews : 0,
    days: daysBetween(campaign.start_date, todayMsk()).length,
  };
}
