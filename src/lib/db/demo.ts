// Демо-данные для просмотра дашборда без базы: DEMO_DATA=1, ссылка /?t=demo.
// Детерминированные (одинаковые при каждом запуске).
import type { PlatformId } from "@/config/platforms";
import { daysBetween, todayMsk } from "@/lib/period";
import type { Campaign, DailyRow, Game, VideoRow } from "./types";

export const DEMO_CAMPAIGN: Campaign = {
  id: "demo", slug: "demo", name: "PoggiPlay", client_token: "demo", sheet_url: null, start_date: "2026-08-05", budget_usd: 20000,
};

export const DEMO_GAMES: Game[] = [
  { id: "g1", campaign_id: "demo", name: "BirdUp", keywords: ["birdup"], is_current: true, sort: 0 },
  { id: "g2", campaign_id: "demo", name: "Buffalo", keywords: ["buffalo"], is_current: false, sort: 1 },
  { id: "g3", campaign_id: "demo", name: "Indiana Mines", keywords: ["indiana mines"], is_current: false, sort: 2 },
];

function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

let cache: { videos: VideoRow[]; daily: DailyRow[] } | null = null;

export function demoData() {
  if (cache) return cache;
  const r = rng(42);
  const days = daysBetween(DEMO_CAMPAIGN.start_date, todayMsk());
  const plan: [PlatformId, number][] = [["instagram", 90], ["tiktok", 24], ["youtube", 10]];
  const names = ["irina_play", "alina.games", "fix_by_katya", "julia.peterson", "annamama_obzor", "bird.queen", "mila_gamer", "kate_fun", "vika.plays", "lera_top"];
  const videos: VideoRow[] = [];
  const dailyMap = new Map<string, number>();
  let acc = 0;
  for (const [platform, n] of plan) {
    for (let i = 0; i < n; i++, acc++) {
      const handle = `${names[acc % names.length]}${acc >= names.length ? acc : ""}`;
      const kind = r() < 0.08 ? "publisher" : "creator";
      const posts = 3 + Math.floor(r() * 25);
      for (let k = 0; k < posts; k++) {
        const di = Math.floor(Math.pow(r(), 0.7) * days.length);
        const day = days[days.length - 1 - di] ?? days[0];
        const views = Math.round(Math.exp(7 + r() * 6.5) * (platform === "instagram" ? 1.4 : 1));
        const g = r();
        const game = di > 50 && g < 0.25 ? "g2" : di > 30 && g < 0.35 ? "g3" : "g1";
        const id = `${platform}-${acc}-${k}`;
        videos.push({
          id, account_id: `a${acc}`, platform, url: platform === "instagram" ? `https://www.instagram.com/reel/${id}/` : platform === "tiktok" ? `https://www.tiktok.com/@${handle}/video/${7500000000000000000 + acc * 1000 + k}` : `https://www.youtube.com/watch?v=${id}`,
          caption: game === "g1" ? "Летаю в BirdUp и не могу остановиться #birdup #игры" : game === "g2" ? "Buffalo затянула #buffalo" : "Копаю золото в Indiana Mines #indianamines",
          published_at: `${day}T12:00:00+03:00`, game_id: game, handle, full_name: null, kind, views,
        });
        // Просмотры набираются за ~10 дней после публикации.
        const start = days.indexOf(day);
        const weights = [0.35, 0.2, 0.12, 0.09, 0.07, 0.05, 0.04, 0.03, 0.03, 0.02];
        weights.forEach((w, j) => {
          const d = days[start + j];
          if (!d) return;
          const key = `${platform}|${d}`;
          dailyMap.set(key, (dailyMap.get(key) ?? 0) + Math.round(views * w));
        });
      }
    }
  }
  const daily: DailyRow[] = [...dailyMap.entries()].map(([k, v]) => {
    const [platform, date] = k.split("|");
    return { platform: platform as PlatformId, date, new_views: v };
  }).sort((a, b) => a.date.localeCompare(b.date));
  cache = { videos, daily };
  return cache;
}
