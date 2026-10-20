import { PLATFORMS } from "@/config/platforms";
import { getDaily } from "@/lib/db/queries";
import { inRange } from "@/lib/dates";
import type { BlockCtx } from "../types";

// Новые просмотры за период по каждой платформе (включая заглушки с нулём — для легенды).
export async function getPlatformShareData({ campaign, range }: BlockCtx) {
  const daily = (await getDaily(campaign.id)).filter((d) => inRange(d.date, range.from, range.to));
  return PLATFORMS.map((p) => ({
    id: p.id,
    label: p.label,
    color: p.color,
    views: daily.filter((d) => d.platform === p.id).reduce((a, d) => a + d.new_views, 0),
  }));
}
