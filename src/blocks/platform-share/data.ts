import { activePlatforms } from "@/config/platforms";
import { getDaily } from "@/lib/db/queries";
import { inRange } from "@/lib/dates";
import type { BlockCtx } from "../types";

// Новые просмотры за период по каждой платформе (список платформ — по всей кампании, чтобы легенда не прыгала).
export async function getPlatformShareData({ campaign, range }: BlockCtx) {
  const all = await getDaily(campaign.id);
  const daily = all.filter((d) => inRange(d.date, range.from, range.to));
  return activePlatforms(all).map((p) => ({
    id: p.id,
    label: p.label,
    color: p.color,
    views: daily.filter((d) => d.platform === p.id).reduce((a, d) => a + d.new_views, 0),
  }));
}
