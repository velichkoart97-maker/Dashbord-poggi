import { PLATFORMS, type PlatformId } from "@/config/platforms";
import type { DailyRow } from "@/lib/db/types";

export type DailyMatrix = {
  days: string[];
  byPlatform: Record<PlatformId, number[]>; // новые просмотры по дням
  totals: number[];
};

// Таблица «день × платформа» для графиков. days — непрерывный список дат.
export function buildDailyMatrix(daily: DailyRow[], days: string[]): DailyMatrix {
  const idx = new Map(days.map((d, i) => [d, i]));
  const byPlatform = Object.fromEntries(PLATFORMS.map((p) => [p.id, days.map(() => 0)])) as Record<PlatformId, number[]>;
  const totals = days.map(() => 0);
  for (const r of daily) {
    const i = idx.get(r.date);
    if (i === undefined || !byPlatform[r.platform]) continue;
    byPlatform[r.platform][i] += r.new_views;
    totals[i] += r.new_views;
  }
  return { days, byPlatform, totals };
}

export function cumulative(xs: number[], start = 0): number[] {
  let acc = start;
  return xs.map((x) => (acc += x));
}
