import { getDaily } from "@/lib/db/queries";
import { daysBetween } from "@/lib/period";
import { buildDailyMatrix, cumulative } from "@/lib/series";
import type { BlockCtx } from "../types";

// CPV на дату = бюджет / все просмотры кампании, накопленные к этой дате.
export async function getCpvData({ campaign, range }: BlockCtx) {
  const daily = await getDaily(campaign.id);
  const lastDataDay = daily.reduce((m, d) => (d.date > m ? d.date : m), campaign.start_date);
  const to = range.to < lastDataDay ? range.to : lastDataDay;
  const m = buildDailyMatrix(daily, daysBetween(campaign.start_date, to));
  const cum = cumulative(m.totals);
  const budget = Number(campaign.budget_usd);
  return m.days
    .map((day, i) => ({ day, cpv: cum[i] > 0 ? budget / cum[i] : null }))
    .filter((p) => p.day >= range.from && p.cpv !== null) as { day: string; cpv: number }[];
}
