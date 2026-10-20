import type { PlatformId } from "@/config/platforms";

export type Campaign = {
  id: string;
  slug: string;
  name: string;
  client_token: string;
  sheet_url: string | null;
  links_sheet_url: string | null;
  start_date: string;
  budget_usd: number;
};

export type Game = {
  id: string;
  campaign_id: string;
  name: string;
  keywords: string[];
  is_current: boolean;
  starts_on: string | null;
  sort: number;
};

// Строка view video_latest (только нужные дашборду колонки).
export type VideoRow = {
  id: string;
  account_id: string;
  platform: PlatformId;
  url: string;
  caption: string | null;
  published_at: string;
  game_id: string | null;
  handle: string;
  full_name: string | null;
  kind: "creator" | "publisher";
  views: number;
};

// Строка view daily_views.
export type DailyRow = { platform: PlatformId; date: string; new_views: number };

export type CollectionRun = { finished_at: string | null; status: string };
