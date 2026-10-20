// Блок «Топ-8 каналов»: горизонтальные столбцы, цвет = платформа.
import { Card, CardLabel } from "@/ui/Card";
import ui from "@/ui/ui.module.css";
import type { BlockCtx } from "../types";
import { getTopChannelsData } from "./data";
import { TopChannelsChart } from "./TopChannelsChart";

export async function TopChannelsBlock(ctx: BlockCtx) {
  const rows = await getTopChannelsData(ctx);
  return (
    <Card>
      <CardLabel>Топ-8 каналов</CardLabel>
      {rows.length ? <TopChannelsChart rows={rows} /> : <div className={ui.empty}>Нет данных за период</div>}
    </Card>
  );
}
