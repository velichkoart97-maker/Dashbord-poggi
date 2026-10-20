"use client";
// Регистрация Chart.js и общий тёмный стиль графиков. Импортировать в каждом клиентском графике.
import {
  Chart, ArcElement, BarElement, CategoryScale, LinearScale, LogarithmicScale,
  LineElement, PointElement, Filler, Tooltip, Legend,
} from "chart.js";

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, LogarithmicScale, LineElement, PointElement, Filler, Tooltip, Legend);

Chart.defaults.color = "#a39790";
Chart.defaults.borderColor = "rgba(255, 186, 150, 0.07)";
// Canvas не понимает CSS-переменные — берём реальный шрифт страницы.
Chart.defaults.font.family = typeof document !== "undefined" ? getComputedStyle(document.body).fontFamily : "system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.boxHeight = 12;
Chart.defaults.plugins.tooltip.backgroundColor = "#241c19";
Chart.defaults.plugins.tooltip.borderColor = "rgba(255, 186, 150, 0.22)";
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.maintainAspectRatio = false;

// Короткая подпись оси: 1.2M / 350K
export function axisShort(v: number | string): string {
  const n = Number(v);
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(n);
}
