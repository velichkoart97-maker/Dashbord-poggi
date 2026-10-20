"use client";
import { useState } from "react";
import { fmtInt, fmtMonth, fmtShort } from "@/lib/format";
import { Card } from "@/ui/Card";
import { Pills } from "@/ui/Pills";
import ui from "@/ui/ui.module.css";
import type { GameRow } from "./data";
import s from "./styles.module.css";

export function GamesTable({ months, tabs, summary }: { months: string[]; tabs: Record<string, GameRow[]>; summary: string }) {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const rows = (tabs[tab] ?? []).filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Card>
      <div className={s.top}>
        <Pills options={[{ value: "all", label: "Всё время" }, ...months.map((m) => ({ value: m, label: fmtMonth(m) }))]} value={tab} onChange={setTab} />
        <input className={s.search} placeholder="Название игры" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className={s.summary}>{summary}</div>
      <div className={ui.tableWrap}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th>#</th><th>Игра</th>
              <th className={ui.right}>Роликов</th><th className={ui.right}>Аккаунтов</th>
              <th className={ui.right}>Просмотров</th><th className={ui.right}>На ролик</th><th>Лучший ролик</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={r.current ? s.current : ""}>
                <td className={s.idx}>{i + 1}</td>
                <td className={s.name}>{r.name}{r.current ? <span className={s.badge}>Текущая</span> : <span className={s.history}>История</span>}</td>
                <td className={`${ui.right} num`}>{fmtInt(r.videos)}</td>
                <td className={`${ui.right} num`}>{fmtInt(r.accounts)}</td>
                <td className={`${ui.right} num ${s.views}`}>{fmtInt(r.views)}</td>
                <td className={`${ui.right} num ${s.muted}`}>{fmtInt(r.videos ? r.views / r.videos : 0)}</td>
                <td>
                  {r.best ? (
                    <a href={r.best.url} target="_blank" rel="noreferrer" className={s.best}>
                      <span>{fmtShort(r.best.views)}</span><small>{r.best.who}</small>
                    </a>
                  ) : <span className={s.muted}>—</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className={ui.empty}>Ничего не найдено</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
