// К какой игре относится ролик, по приоритету:
// 1) у аккаунта в таблице указана игра (колонка «Игра») → она;
// 2) ключевое слово другой игры в подписи → та игра;
// 3) у игр задана дата начала → игра с самой поздней датой начала, не позже публикации;
// 4) иначе — текущая.
export type GameRule = { id: string; name: string; keywords: string[]; is_current: boolean; starts_on: string | null };

export function assignGame(caption: string, publishedOn: string, accountGameId: string | null, games: GameRule[]): string | null {
  if (accountGameId) return accountGameId;
  const text = caption.toLowerCase();
  for (const g of games) {
    if (g.is_current) continue;
    if (g.keywords.some((k) => k && text.includes(k.toLowerCase()))) return g.id;
  }
  const byDate = games
    .filter((g) => g.starts_on && g.starts_on <= publishedOn)
    .sort((a, b) => b.starts_on!.localeCompare(a.starts_on!))[0];
  if (byDate) return byDate.id;
  return games.find((g) => g.is_current)?.id ?? null;
}

// Игра из колонки таблицы → id (по названию или ключевому слову, без учёта регистра).
export function gameIdByName(name: string | null, games: GameRule[]): string | null {
  const n = name?.trim().toLowerCase();
  if (!n) return null;
  return games.find((g) => g.name.toLowerCase() === n || g.keywords.some((k) => k.toLowerCase() === n))?.id ?? null;
}
