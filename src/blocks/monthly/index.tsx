// Блок «По месяцам»: столбцы по платформам + таблица с CPV на конец месяца.
import { fmtCpv, fmtInt, fmtMonth } from "@/lib/format";
import { Card, SectionTitle } from "@/ui/Card";
import ui from "@/ui/ui.module.css";
import type { BlockCtx } from "../types";
import { getMonthlyData } from "./data";
import { MonthlyChart } from "./MonthlyChart";
import s from "./styles.module.css";

export async function MonthlyBlock(ctx: BlockCtx) {
  const { platforms, months } = await getMonthlyData(ctx);
  return (
    <>
      <SectionTitle title="По месяцам" />
      <Card>
        {months.length ? <MonthlyChart months={months} platforms={platforms} /> : <div className={ui.empty}>Данных пока нет</div>}
      </Card>
      <Card>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Месяц</th>
                <th className={ui.right}>Новых просмотров</th>
                {platforms.map((p) => <th key={p.id} className={ui.right} style={{ color: p.color }}>{p.label}</th>)}
                <th className={ui.right}>CPV</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.ym}>
                  <td className={s.month}>{fmtMonth(m.ym)}</td>
                  <td className={`${ui.right} num ${s.total}`}>{fmtInt(m.total)}</td>
                  {platforms.map((p) => <td key={p.id} className={`${ui.right} num ${s.cell}`}>{fmtInt(m.byPlatform[p.id])}</td>)}
                  <td className={`${ui.right} ${s.cell}`}>{fmtCpv(m.cpv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
