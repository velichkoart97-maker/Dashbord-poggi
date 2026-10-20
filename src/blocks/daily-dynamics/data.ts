import { getDaily } from "@/lib/db/queries";
import { daysBetween } from "@/lib/period";
import { buildDailyMatrix } from "@/lib/series";
import type { BlockCtx } from "../types";

export async function getDailyDynamicsData({ campaign, range }: BlockCtx) {
  const daily = await getDaily(campaign.id);
  const lastDataDay = daily.reduce((m, d) => (d.date > m ? d.date : m), campaign.start_date);
  const to = range.to < lastDataDay ? range.to : lastDataDay;

  // Матрица со старта кампании: нужна для «нарастающим итогом» и сравнения недель.
  const all = buildDailyMatrix(daily, daysBetween(campaign.start_date, to));
  const n = all.totals.length;
  const sum = (from: number, len: number) => all.totals.slice(Math.max(0, from), Math.max(0, from + len)).reduce((a, x) => a + x, 0);

  const lastDay = all.totals[n - 1] ?? 0;
  const prevDay = all.totals[n - 2] ?? 0;
  const week = sum(n - 7, 7);
  const prevWeek = sum(n - 14, 7);

  // Для графика — только дни выбранного периода.
  const startIdx = all.days.indexOf(range.from < campaign.start_date ? campaign.start_date : range.from);
  const sliceFrom = startIdx < 0 ? 0 : startIdx;
  const before = all.totals.slice(0, sliceFrom).reduce((a, x) => a + x, 0);

  return {
    kpi: {
      cumulative: all.totals.reduce((a, x) => a + x, 0),
      asOf: to,
      lastDay,
      dayDelta: lastDay - prevDay,
      dayDeltaPct: prevDay > 0 ? (lastDay - prevDay) / prevDay : null,
      avg7: week / Math.min(7, Math.max(1, n)),
      week,
      wow: prevWeek > 0 ? (week - prevWeek) / prevWeek : null,
    },
    chart: {
      days: all.days.slice(sliceFrom),
      byPlatform: Object.fromEntries(Object.entries(all.byPlatform).map(([k, v]) => [k, v.slice(sliceFrom)])),
      before, // сумма до начала периода — стартовая точка для режима «Накопленные»
    },
  };
}
