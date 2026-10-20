// Блок «Игры» (в референсе — «Товары»): статистика по каждой игре, вкладки по месяцам, поиск.
// Как ролик относится к игре — см. collector/games.ts; список игр и ключевые слова — в админке.
import { fmtInt } from "@/lib/format";
import { SectionTitle } from "@/ui/Card";
import type { BlockCtx } from "../types";
import { getGamesData } from "./data";
import { GamesTable } from "./GamesTable";

export async function GamesBlock(ctx: BlockCtx) {
  const d = await getGamesData(ctx);
  const summary = `Игр: ${d.tabs.all.length} · роликов с игрой ${fmtInt(d.taggedVideos)} из ${fmtInt(d.totalVideos)}, их просмотры ${fmtInt(d.taggedViews)}`;
  return (
    <>
      <SectionTitle title="Игры" note="по ключевым словам в подписях; без явной метки ролик считается текущей игрой" />
      <GamesTable months={d.months} tabs={d.tabs} summary={summary} />
    </>
  );
}
