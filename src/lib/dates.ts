// Дата публикации ролика по Москве: "2026-08-05".
export function mskDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
}

export const inRange = (day: string, from: string, to: string) => day >= from && day <= to;
