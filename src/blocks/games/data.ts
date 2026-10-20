import { getGames, getVideos } from "@/lib/db/queries";
import { mskDate } from "@/lib/dates";
import type { VideoRow } from "@/lib/db/types";
import type { BlockCtx } from "../types";

export type GameRow = {
  id: string;
  name: string;
  current: boolean;
  videos: number;
  accounts: number;
  views: number;
  best: { url: string; views: number; who: string } | null;
};

function aggregate(games: { id: string; name: string; is_current: boolean }[], videos: VideoRow[]): GameRow[] {
  return games
    .map((g) => {
      const vs = videos.filter((v) => v.game_id === g.id);
      const best = vs.reduce<VideoRow | null>((b, v) => (!b || v.views > b.views ? v : b), null);
      return {
        id: g.id,
        name: g.name,
        current: g.is_current,
        videos: vs.length,
        accounts: new Set(vs.map((v) => v.account_id)).size,
        views: vs.reduce((a, v) => a + v.views, 0),
        best: best ? { url: best.url, views: best.views, who: best.full_name || `@${best.handle}` } : null,
      };
    })
    // Текущая игра всегда первой, остальные — по просмотрам.
    .sort((a, b) => Number(b.current) - Number(a.current) || b.views - a.views);
}

// Вкладки: «Всё время» + месяцы по дате публикации (новые сверху).
export async function getGamesData({ campaign }: BlockCtx) {
  const [games, videos] = await Promise.all([getGames(campaign.id), getVideos(campaign.id)]);
  const withMonth = videos.map((v) => ({ v, ym: mskDate(v.published_at).slice(0, 7) }));
  const months = [...new Set(withMonth.map((x) => x.ym))].sort().reverse();

  const tabs: Record<string, GameRow[]> = { all: aggregate(games, videos) };
  for (const ym of months) tabs[ym] = aggregate(games, withMonth.filter((x) => x.ym === ym).map((x) => x.v));

  return {
    months,
    tabs,
    totalVideos: videos.length,
    taggedVideos: videos.filter((v) => v.game_id).length,
    taggedViews: videos.filter((v) => v.game_id).reduce((a, v) => a + v.views, 0),
  };
}
