"use client";
import { useState } from "react";
import { axisShort } from "@/ui/chartSetup";
import { Bar } from "react-chartjs-2";
import type { Platform } from "@/config/platforms";
import { fmtDayShort, fmtInt } from "@/lib/format";
import { cumulative } from "@/lib/series";
import { Card } from "@/ui/Card";
import { Pills } from "@/ui/Pills";
import s from "./styles.module.css";

type Mode = "new" | "cum";

export function DailyChart({ platforms, days, byPlatform, before }: { platforms: Platform[]; days: string[]; byPlatform: Record<string, number[]>; before: number }) {
  const [mode, setMode] = useState<Mode>("new");
  const [only, setOnly] = useState<string>("all");

  const visible = platforms.filter((p) => only === "all" || p.id === only);
  // В режиме «Накопленные» платформы складываются в общий нарастающий итог.
  const series = visible.map((p) => {
    const raw = byPlatform[p.id] ?? days.map(() => 0);
    return { p, data: mode === "new" ? raw : cumulative(raw) };
  });
  if (mode === "cum" && only === "all" && series.length) {
    series[0] = { ...series[0], data: series[0].data.map((x) => x + before) };
  }

  return (
    <>
      <div className={s.controls}>
        <Pills<Mode> options={[{ value: "new", label: "Новых за день" }, { value: "cum", label: "Накопленные" }]} value={mode} onChange={setMode} />
        <div className={s.chips}>
          <button type="button" className={`${s.chip} ${only === "all" ? s.chipOn : ""}`} style={{ ["--c" as string]: "#f4a07e" }} onClick={() => setOnly("all")}>Все</button>
          {platforms.map((p) => (
            <button key={p.id} type="button" className={`${s.chip} ${only === p.id ? s.chipOn : ""}`}
              style={{ ["--c" as string]: p.color }} onClick={() => setOnly(p.id)}>{p.label}</button>
          ))}
        </div>
      </div>
      <Card>
        <div style={{ height: 380 }}>
          <Bar
            data={{
              labels: days.map(fmtDayShort),
              datasets: series.map(({ p, data }) => ({ label: p.label, data, backgroundColor: p.color, borderRadius: 3, barPercentage: 0.8, categoryPercentage: 0.9 })),
            }}
            options={{
              plugins: {
                legend: { position: "top" },
                tooltip: { mode: "index", filter: (i) => Number(i.raw) > 0, callbacks: { label: (c) => ` ${c.dataset.label}: ${fmtInt(Number(c.raw))}` } },
              },
              scales: {
                x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 40 } },
                y: { stacked: true, ticks: { callback: axisShort } },
              },
            }}
          />
        </div>
      </Card>
    </>
  );
}
