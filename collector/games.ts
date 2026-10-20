// К какой игре относится ролик: ключевое слово другой игры в подписи → та игра, иначе — текущая.
export type GameRule = { id: string; keywords: string[]; is_current: boolean };

export function assignGame(caption: string, games: GameRule[]): string | null {
  const text = caption.toLowerCase();
  const current = games.find((g) => g.is_current);
  for (const g of games) {
    if (g.is_current) continue;
    if (g.keywords.some((k) => k && text.includes(k.toLowerCase()))) return g.id;
  }
  return current?.id ?? null;
}
