"use client";
import "@/ui/chartSetup";
import { Doughnut } from "react-chartjs-2";
import { fmtInt, fmtPct } from "@/lib/format";

type Row = { label: string; color: string; views: number };

export function PlatformDonut({ rows }: { rows: Row[] }) {
  const total = rows.reduce((a, r) => a + r.views, 0);
  return (
    <div style={{ height: 360 }}>
      <Doughnut
        data={{
          labels: rows.map((r) => r.label),
          datasets: [{ data: rows.map((r) => r.views), backgroundColor: rows.map((r) => r.color), borderColor: "#161211", borderWidth: 3 }],
        }}
        options={{
          cutout: "55%",
          plugins: {
            legend: { position: "top" },
            tooltip: { callbacks: { label: (c) => ` ${c.label}: ${fmtInt(Number(c.raw))} (${fmtPct(Number(c.raw), total)})` } },
          },
        }}
      />
    </div>
  );
}
