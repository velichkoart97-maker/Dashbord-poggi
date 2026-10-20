import type { Range } from "@/lib/period";
import type { Campaign } from "@/lib/db/types";

// Что получает каждый блок дашборда. Блок сам решает, какие данные ему нужны (см. data.ts в его папке).
export type BlockCtx = {
  campaign: Campaign;
  range: Range;
  params: Record<string, string | undefined>; // текущие параметры URL (t, p, from, to)
};
