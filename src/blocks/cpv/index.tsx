// Блок «CPV в динамике»: стоимость просмотра в $ по дням, логарифмическая шкала.
import { Card, SectionTitle } from "@/ui/Card";
import ui from "@/ui/ui.module.css";
import type { BlockCtx } from "../types";
import { getCpvData } from "./data";
import { CpvChart } from "./CpvChart";

export async function CpvBlock(ctx: BlockCtx) {
  const points = await getCpvData(ctx);
  return (
    <>
      <SectionTitle title="CPV в динамике" note="бюджет ÷ просмотры, накопленные к дате" />
      <Card>{points.length ? <CpvChart points={points} /> : <div className={ui.empty}>Нет данных за период</div>}</Card>
    </>
  );
}
