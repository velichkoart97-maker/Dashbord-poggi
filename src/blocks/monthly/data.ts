import { activePlatforms } from "@/config/platforms";
import { getDaily } from "@/lib/db/queries";
import type { BlockCtx } from "../types";

// Помесячно за всю кампанию (не зависит от фильтра периода, как в референсе).
export async function getMonthlyData({ campaign }: BlockCtx) {
  const daily = await getDaily(campaign.id);
  const months = [...new Set(daily.map((d) => d.date.slice(0, 7)))].sort();
  const budget = Number(campaign.budget_usd);
  const platforms = activePlatforms(daily);
  let cum = 0;
  const rows = months.map((ym) => {
    const rows = daily.filter((d) => d.date.startsWith(ym));
    const byPlatform = Object.fromEntries(
      platforms.map((p) => [p.id, rows.filter((r) => r.platform === p.id).reduce((a, r) => a + r.new_views, 0)]),
    );
    const total = rows.reduce((a, r) => a + r.new_views, 0);
    cum += total;
    return { ym, total, byPlatform, cpv: cum > 0 ? budget / cum : 0 };
  });
  return { platforms, months: rows };
}
