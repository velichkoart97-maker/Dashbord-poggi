"use client";
import { useMemo, useState } from "react";
import { fmtInt, fmtShort } from "@/lib/format";
import { Card } from "@/ui/Card";
import { Pills } from "@/ui/Pills";
import { PlatformBadge } from "@/ui/PlatformBadge";
import ui from "@/ui/ui.module.css";
import type { TopVideo } from "./data";
import s from "./styles.module.css";

type Bucket = "100k" | "500k" | "1m";
type Period = "all" | "7d" | "30d" | "custom";

const BUCKETS: Record<Bucket, [number, number]> = { "100k": [100_000, 500_000], "500k": [500_000, 1_000_000], "1m": [1_000_000, Infinity] };
const BUCKET_LABEL: Record<Bucket, string> = { "100k": "100–500K просмотров", "500k": "500K–1M просмотров", "1m": "1M+ просмотров" };
const PAGE = 10;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
}

type Props = {
  top: TopVideo[]; channels: number; total: number; startDate: string;
  byPlatform: { id: string; label: string; color: string; n: number }[];
};

export function TopVideosTable({ top, channels, total, byPlatform, startDate }: Props) {
  const [bucket, setBucket] = useState<Bucket>("100k");
  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState(startDate);
  const [to, setTo] = useState(daysAgo(0));
  const [shown, setShown] = useState(PAGE);

  const rows = useMemo(() => {
    const [lo, hi] = BUCKETS[bucket];
    const f = period === "7d" ? daysAgo(6) : period === "30d" ? daysAgo(29) : period === "custom" ? from : "0000";
    const t = period === "custom" ? to : "9999";
    return top.filter((v) => v.views >= lo && v.views < hi && v.date >= f && v.date <= t);
  }, [top, bucket, period, from, to]);

  return (
    <Card>
      <div className={s.head}>
        <h2 className={s.title}><span className={s.fire}>●</span> Топ-видео <span className={s.sub}>{BUCKET_LABEL[bucket]}</span></h2>
        <div className={s.filters}>
          <Pills<Bucket> options={[{ value: "100k", label: "100–500K" }, { value: "500k", label: "500K–1M" }, { value: "1m", label: "1M+" }]}
            value={bucket} onChange={(v) => { setBucket(v); setShown(PAGE); }} />
          <Pills<Period> options={[{ value: "all", label: "Всё время" }, { value: "7d", label: "7 дней" }, { value: "30d", label: "30 дней" }, { value: "custom", label: "Свой период" }]}
            value={period} onChange={(v) => { setPeriod(v); setShown(PAGE); }} />
        </div>
      </div>
      {period === "custom" && (
        <div className={s.custom}>
          <label>с <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>по <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
      )}
      <div className={s.meta}>
        {fmtInt(channels)} каналов · {fmtInt(total)} роликов (
        {byPlatform.map((p, i) => (
          <span key={p.id}>{i > 0 && " · "}<span style={{ color: p.color }}>{p.label}: {fmtInt(p.n)}</span></span>
        ))}
        ) · найдено: <b>{fmtInt(rows.length)}</b>
      </div>
      <div className={ui.tableWrap}>
        <table className={ui.table}>
          <thead><tr><th>Платформа</th><th>Видео</th><th className={ui.right}>Просмотров</th><th>Опубликовано</th></tr></thead>
          <tbody>
            {rows.slice(0, shown).map((v) => (
              <tr key={v.url}>
                <td><PlatformBadge id={v.platform} /></td>
                <td className={s.video}>
                  <a href={v.url} target="_blank" rel="noreferrer">{v.url}</a>
                  {v.caption && <div className={s.caption}>{v.caption}</div>}
                </td>
                <td className={`${ui.right} ${s.views}`}>{fmtShort(v.views)}</td>
                <td className={s.date}>{v.date}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className={ui.empty}>Нет роликов в этом диапазоне</td></tr>}
          </tbody>
        </table>
      </div>
      {rows.length > shown && (
        <button type="button" className={s.more} onClick={() => setShown(shown + PAGE)}>Показать ещё ({rows.length - shown})</button>
      )}
    </Card>
  );
}
