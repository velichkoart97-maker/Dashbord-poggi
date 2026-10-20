// Общий фильтр периода (блок period-filter). Значение живёт в URL: ?p=7d | 30d | month | prev | all | custom&from=&to=

export type PeriodKey = "all" | "7d" | "30d" | "month" | "prev" | "custom";

export type Range = { key: PeriodKey; from: string; to: string }; // ISO-даты, включительно

export const PERIOD_LABELS: Record<Exclude<PeriodKey, "custom">, string> = {
  all: "Весь период",
  "7d": "7 дней",
  "30d": "30 дней",
  month: "Этот месяц",
  prev: "Пред. месяц",
};

export function todayMsk(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function resolveRange(params: Record<string, string | undefined>, startDate: string): Range {
  const today = todayMsk();
  const key = (params.p as PeriodKey) || "all";
  const clamp = (r: Range): Range => ({ ...r, from: r.from < startDate ? startDate : r.from });
  switch (key) {
    case "7d": return clamp({ key, from: addDays(today, -6), to: today });
    case "30d": return clamp({ key, from: addDays(today, -29), to: today });
    case "month": return clamp({ key, from: today.slice(0, 8) + "01", to: today });
    case "prev": {
      const firstThis = today.slice(0, 8) + "01";
      const lastPrev = addDays(firstThis, -1);
      return clamp({ key, from: lastPrev.slice(0, 8) + "01", to: lastPrev });
    }
    case "custom":
      return clamp({ key, from: params.from || startDate, to: params.to || today });
    default:
      return { key: "all", from: startDate, to: today };
  }
}

export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export { addDays };
