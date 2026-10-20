// Чтение списка аккаунтов из Google Таблицы (доступ по ссылке, экспорт в CSV).
// Обязательна только колонка со ссылками. Необязательные колонки по заголовку: «ФИО», «Тип» (креатор/публикатор), «Игра»,
// «С даты» (ДД.ММ.ГГГГ или ГГГГ-ММ-ДД — ролики аккаунта раньше этой даты не берём).
import { platformFromUrl } from "../src/config/platforms";
import type { SheetAccount } from "./types";
import { handleFromUrl } from "./handles";

export function csvExportUrl(sheetUrl: string): string {
  const id = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) throw new Error(`Не похоже на ссылку Google Таблицы: ${sheetUrl}`);
  // Без gid в ссылке Google отдаёт первый лист (у листа, созданного загрузкой, gid не 0).
  const gid = sheetUrl.match(/[#&?]gid=(\d+)/)?.[1];
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid ? `&gid=${gid}` : ""}`;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// «01.10.2026» или «2026-10-01» → «2026-10-01»; остальное — null.
function parseDate(s: string): string | null {
  const t = s.trim();
  const ru = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ru) return `${ru[3]}-${ru[2].padStart(2, "0")}-${ru[1].padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

export function parseAccounts(rows: string[][]): { accounts: SheetAccount[]; skipped: string[] } {
  const isUrl = (s: string) => /https?:\/\//i.test(s);
  const header = rows[0] && !rows[0].some(isUrl) ? rows[0].map((h) => h.toLowerCase()) : null;
  const body = header ? rows.slice(1) : rows;
  const col = (re: RegExp) => (header ? header.findIndex((h) => re.test(h)) : -1);
  const nameCol = col(/фио|имя|name/);
  const typeCol = col(/тип|type/);
  const gameCol = col(/игра|game/);
  const sinceCol = col(/с даты|since/);

  const accounts: SheetAccount[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  body.forEach((cells, i) => {
    const url = cells.find(isUrl)?.trim();
    if (!url) return;
    const platform = platformFromUrl(url);
    const handle = platform ? handleFromUrl(platform, url) : null;
    if (!platform || !handle) { skipped.push(url); return; }
    const key = `${platform}:${handle.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    accounts.push({
      row: i + (header ? 2 : 1),
      url,
      platform,
      handle,
      fullName: nameCol >= 0 ? cells[nameCol]?.trim() || null : null,
      game: gameCol >= 0 ? cells[gameCol]?.trim() || null : null,
      since: sinceCol >= 0 ? parseDate(cells[sinceCol] ?? "") : null,
      kind: typeCol >= 0 && /публик|publish/i.test(cells[typeCol] ?? "") ? "publisher" : "creator",
    });
  });
  return { accounts, skipped };
}

export async function readSheet(sheetUrl: string) {
  const res = await fetch(csvExportUrl(sheetUrl), { redirect: "follow" });
  if (!res.ok) throw new Error(`Google Таблица недоступна (${res.status}). Откройте доступ «Все, у кого есть ссылка».`);
  return parseAccounts(parseCsv(await res.text()));
}
