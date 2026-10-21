"use client";
import { axisShort } from "@/ui/chartSetup";
import { Bar } from "react-chartjs-2";
import type { Platform } from "@/config/platforms";
import { fmtInt, fmtMonth } from "@/lib/format";

type Month = { ym: string; byPlatform: Record<string, number> };

export function MonthlyChart({ months, platforms }: { months: Month[]; platforms: Platform[] }) {
  return (
    <div style={{ height: 320 }}>
      <Bar
        data={{
          labels: months.map((m) => fmtMonth(m.ym)),
          datasets: platforms.map((p) => ({
            label: p.label, data: months.map((m) => m.byPlatform[p.id] ?? 0), backgroundColor: p.color, barPercentage: 0.7,
          })),
        }}
        options={{
          plugins: { legend: { position: "top" }, tooltip: { mode: "index", filter: (i) => Number(i.raw) > 0, callbacks: { label: (c) => ` ${c.dataset.label}: ${fmtInt(Number(c.raw))}` } } },
          scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ticks: { callback: axisShort } } },
        }}
      />
    </div>
  );
}
