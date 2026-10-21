// Блок «Динамика по дням»: 4 KPI + столбцы по дням с разбивкой по платформам.
import { fmtDate, fmtShort } from "@/lib/format";
import { Card, SectionTitle } from "@/ui/Card";
import type { BlockCtx } from "../types";
import { getDailyDynamicsData } from "./data";
import { DailyChart } from "./DailyChart";
import s from "./styles.module.css";

const pct = (x: number) => `${x > 0 ? "+" : ""}${Math.round(x * 100)}%`;

export async function DailyDynamicsBlock(ctx: BlockCtx) {
  const { kpi, chart } = await getDailyDynamicsData(ctx);
  return (
    <>
      <SectionTitle title="Динамика по дням" />
      <div className={s.kpis}>
        <Card>
          <div className={s.label}>Итого (нарастающим)</div>
          <div className={`${s.value} ${s.accent}`}>{fmtShort(kpi.cumulative)}</div>
          <div className={s.sub}>{fmtDate(kpi.asOf)}</div>
        </Card>
        <Card>
          <div className={s.label}>Новых за последний день</div>
          <div className={s.value}>{fmtShort(kpi.lastDay)}</div>
          <div className={kpi.dayDelta >= 0 ? s.good : s.bad}>
            {kpi.dayDelta >= 0 ? "+" : "−"}{fmtShort(Math.abs(kpi.dayDelta))} vs пред. день
            {kpi.dayDeltaPct !== null && ` (${pct(kpi.dayDeltaPct)})`}
          </div>
        </Card>
        <Card>
          <div className={s.label}>Среднее за 7 дней</div>
          <div className={s.value}>{fmtShort(kpi.avg7)}</div>
          <div className={s.sub}>сумма за неделю: {fmtShort(kpi.week)}</div>
        </Card>
        <Card>
          <div className={s.label}>Скорость роста (WoW)</div>
          <div className={`${s.value} ${kpi.wow !== null && kpi.wow < 0 ? s.badValue : s.accent}`}>
            {kpi.wow === null ? "—" : pct(kpi.wow)}
          </div>
          <div className={s.sub}>эта неделя vs прошлая</div>
        </Card>
      </div>
      <DailyChart platforms={chart.platforms} days={chart.days} byPlatform={chart.byPlatform} before={chart.before} />
    </>
  );
}
