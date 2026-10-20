// Блок «Топ-видео»: ролики от 100K просмотров с фильтрами по диапазону просмотров и дате публикации.
// У блока свой период (как в референсе), общий фильтр страницы на него не влияет.
import type { BlockCtx } from "../types";
import { getTopVideosData } from "./data";
import { TopVideosTable } from "./TopVideosTable";

export async function TopVideosBlock(ctx: BlockCtx) {
  const d = await getTopVideosData(ctx);
  return <TopVideosTable {...d} startDate={ctx.campaign.start_date} />;
}
