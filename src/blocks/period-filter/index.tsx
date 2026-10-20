// Блок «Фильтр периода»: общий период для KPI, креаторов, платформ, каналов, динамики и CPV.
// Состояние живёт в URL (?p=…&from=…&to=…), поэтому работает без JS и ссылкой можно поделиться.
import { PERIOD_LABELS } from "@/lib/period";
import { LinkPills } from "@/ui/Pills";
import type { BlockCtx } from "../types";
import s from "./styles.module.css";

export function PeriodFilterBlock({ range, params }: BlockCtx) {
  const href = (p: string) => `?${new URLSearchParams({ t: params.t ?? "", p }).toString()}`;
  const options = Object.entries(PERIOD_LABELS).map(([key, label]) => ({ key, label, href: href(key) }));
  return (
    <div className={s.bar}>
      <LinkPills options={options} active={range.key} />
      <form method="get" className={s.custom}>
        <input type="hidden" name="t" value={params.t ?? ""} />
        <input type="hidden" name="p" value="custom" />
        <label>с <input type="date" name="from" defaultValue={range.from} className={s.date} /></label>
        <label>по <input type="date" name="to" defaultValue={range.to} className={s.date} /></label>
        <button type="submit" className={`${s.apply} ${range.key === "custom" ? s.applyActive : ""}`}>Показать</button>
      </form>
    </div>
  );
}
