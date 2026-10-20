// Форматирование чисел и дат для всех блоков.

const nf = new Intl.NumberFormat("ru-RU");

export const fmtInt = (n: number) => nf.format(Math.round(n));

export function fmtShort(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

export function fmtUsd(n: number, digits = 0): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// CPV бывает очень маленьким: показываем значимые знаки.
export function fmtCpv(n: number): string {
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= 1) return fmtUsd(n, 2);
  return "$" + n.toPrecision(2);
}

export const fmtPct = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : "0%";

const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_SHORT = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];

// "2026-08" → "Август 2026"
export function fmtMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

// "2026-08-05" → "5 авг"
export function fmtDayShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

// "2026-08-05" → "05.08.2026"
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export function fmtDateTimeMsk(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
