"use client";
import { axisShort } from "@/ui/chartSetup";
import { Bar } from "react-chartjs-2";
import { PLATFORM_BY_ID, type PlatformId } from "@/config/platforms";
import { fmtInt } from "@/lib/format";

type Row = { handle: string; platform: PlatformId; views: number };

export function TopChannelsChart({ rows }: { rows: Row[] }) {
  return (
    <div style={{ height: 360 }}>
      <Bar
        data={{
          labels: rows.map((r) => r.handle),
          datasets: [{
            data: rows.map((r) => r.views),
            backgroundColor: rows.map((r) => PLATFORM_BY_ID[r.platform].color),
            borderRadius: 8,
            barPercentage: 0.7,
          }],
        }}
        options={{
          indexAxis: "y",
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${fmtInt(Number(c.raw))} просмотров` } } },
          scales: { x: { ticks: { callback: axisShort } }, y: { grid: { display: false } } },
        }}
      />
    </div>
  );
}
