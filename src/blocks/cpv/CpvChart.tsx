"use client";
import "@/ui/chartSetup";
import { Line } from "react-chartjs-2";
import { fmtCpv, fmtDayShort } from "@/lib/format";

export function CpvChart({ points }: { points: { day: string; cpv: number }[] }) {
  return (
    <div style={{ height: 320 }}>
      <Line
        data={{
          labels: points.map((p) => fmtDayShort(p.day)),
          datasets: [{
            data: points.map((p) => p.cpv),
            borderColor: "#ee7b62",
            backgroundColor: "rgba(238, 123, 98, 0.12)",
            fill: true,
            tension: 0.3,
            pointRadius: points.length > 40 ? 0 : 3,
            pointBackgroundColor: "#f4a07e",
          }],
        }}
        options={{
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` CPV: ${fmtCpv(Number(c.raw))}` } } },
          scales: {
            x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 20 } },
            // На лог-шкале подписываем только 1, 2, 5 × 10ⁿ, иначе подписи слипаются.
            y: { type: "logarithmic", ticks: { callback: (v) => { const n = Number(v); const lead = Number(n.toExponential(0).split("e")[0]); return [1, 2, 5].includes(lead) ? fmtCpv(n) : ""; } } },
          },
        }}
      />
    </div>
  );
}
