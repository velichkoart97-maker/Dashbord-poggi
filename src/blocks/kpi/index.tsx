// Блок «KPI-карточки»: просмотры, видео, каналы, бюджет и CPV, дни данных.
import { fmtCpv, fmtDate, fmtInt, fmtUsd } from "@/lib/format";
import { todayMsk } from "@/lib/period";
import type { BlockCtx } from "../types";
import { getKpiData } from "./data";
import s from "./styles.module.css";

function Tile({ label, value, sub, muted }: { label: string; value: string; sub?: string; muted?: boolean }) {
  return (
    <div className={`${s.tile} ${muted ? s.muted : ""}`}>
      <div className={s.label}>{label}</div>
      <div className={`${s.value} num`}>{value}</div>
      {sub && <div className={s.sub}>{sub}</div>}
    </div>
  );
}

export async function KpiBlock(ctx: BlockCtx) {
  const d = await getKpiData(ctx);
  const period = `${fmtDate(ctx.range.from)} — ${fmtDate(ctx.range.to)}`;
  const split = (xs: { label: string; n: number }[]) => xs.map((x) => `${fmtInt(x.n)} ${x.label}`).join(" · ");
  return (
    <div className={s.grid}>
      <Tile label="Просмотров за период" value={fmtInt(d.views)} sub={period} />
      <Tile label="Всего видео" value={fmtInt(d.videos)} sub={split(d.videosBy)} />
      <Tile label="Каналов" value={fmtInt(d.channels)} sub={split(d.channelsBy)} />
      <Tile label="Бюджет кампании" value={fmtUsd(d.budget)} sub={`CPV по всей кампании: ${fmtCpv(d.cpv)} за просмотр`} />
      <Tile label="Дней данных" value={fmtInt(d.days)} sub={`${fmtDate(ctx.campaign.start_date)} — ${fmtDate(todayMsk())}`} />
    </div>
  );
}
