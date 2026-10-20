// Блок «Просмотры по платформам»: кольцевая диаграмма за выбранный период.
import { Card, CardLabel } from "@/ui/Card";
import type { BlockCtx } from "../types";
import { getPlatformShareData } from "./data";
import { PlatformDonut } from "./PlatformDonut";

export async function PlatformShareBlock(ctx: BlockCtx) {
  const rows = await getPlatformShareData(ctx);
  return (
    <Card>
      <CardLabel>Просмотры по платформам</CardLabel>
      <PlatformDonut rows={rows} />
    </Card>
  );
}
