import { cache } from "react";
import { db, fetchAll } from "./client";
import type { Campaign, CollectionRun, DailyRow, Game, VideoRow } from "./types";
import { DEMO_CAMPAIGN, DEMO_GAMES, demoData } from "./demo";

const DEMO = process.env.DEMO_DATA === "1";

// Общие запросы. cache() — один запрос на рендер страницы, сколько бы блоков их ни вызвало.

export const getCampaignByToken = cache(async (token: string): Promise<Campaign | null> => {
  if (DEMO) return token === "demo" ? DEMO_CAMPAIGN : null;
  const { data } = await db().from("campaigns").select("*").eq("client_token", token).maybeSingle();
  return (data as Campaign) ?? null;
});

export const getGames = cache(async (campaignId: string): Promise<Game[]> => {
  if (DEMO) return DEMO_GAMES;
  const { data, error } = await db().from("games").select("*").eq("campaign_id", campaignId).order("sort");
  if (error) throw new Error(error.message);
  return (data ?? []) as Game[];
});

export const getVideos = cache(async (campaignId: string): Promise<VideoRow[]> =>
  DEMO ? demoData().videos : fetchAll<VideoRow>((from, to) =>
    db().from("video_latest")
      .select("id,account_id,platform,url,caption,published_at,game_id,handle,full_name,kind,views")
      .eq("campaign_id", campaignId)
      .order("id")
      .range(from, to),
  ).then((rows) => rows.map((r) => ({ ...r, views: Number(r.views) }))),
);

export const getDaily = cache(async (campaignId: string): Promise<DailyRow[]> =>
  DEMO ? demoData().daily : fetchAll<DailyRow>((from, to) =>
    db().from("daily_views")
      .select("platform,date,new_views")
      .eq("campaign_id", campaignId)
      .order("date")
      .order("platform")
      .range(from, to),
  ).then((rows) => rows.map((r) => ({ ...r, new_views: Number(r.new_views) }))),
);

export const getLastRun = cache(async (campaignId: string): Promise<CollectionRun | null> => {
  if (DEMO) return { finished_at: new Date().toISOString(), status: "ok" };
  const { data } = await db().from("collection_runs")
    .select("finished_at,status")
    .eq("campaign_id", campaignId)
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CollectionRun) ?? null;
});
