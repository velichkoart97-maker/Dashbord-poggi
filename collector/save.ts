// Запись в базу: аккаунты, ролики, снимок просмотров за сегодня (МСК).
import { db } from "../src/lib/db/client";
import { chunk } from "./apify";
import { assignGame, gameIdByName, type GameRule } from "./games";
import type { CollectedVideo, SheetAccount } from "./types";

type SavedAccount = { id: string; platform: string; handle: string; game_id: string | null };

// Дата публикации по МСК (UTC+3).
export const mskDate = (iso: string) => new Date(Date.parse(iso) + 3 * 3600_000).toISOString().slice(0, 10);

export async function saveAccounts(campaignId: string, accounts: SheetAccount[], games: GameRule[]) {
  const rows = accounts.map((a) => ({
    campaign_id: campaignId, url: a.url, platform: a.platform, handle: a.handle,
    full_name: a.fullName, kind: a.kind, sheet_row: a.row, active: true,
    game_id: gameIdByName(a.game, games),
  }));
  const saved: SavedAccount[] = [];
  for (const part of chunk(rows, 500)) {
    const { data, error } = await db().from("accounts").upsert(part, { onConflict: "campaign_id,url" }).select("id,platform,handle,game_id");
    if (error) throw new Error(`accounts: ${error.message}`);
    saved.push(...(data ?? []));
  }
  // Аккаунты, удалённые из таблицы, не удаляем (их ролики остаются в истории), а выключаем.
  const keep = new Set(saved.map((a) => a.id));
  const { data: all } = await db().from("accounts").select("id").eq("campaign_id", campaignId).eq("active", true);
  const gone = (all ?? []).map((a) => a.id).filter((id) => !keep.has(id));
  for (const part of chunk(gone, 200)) await db().from("accounts").update({ active: false }).in("id", part);
  return saved;
}

export async function saveVideos(
  campaignId: string,
  accounts: SavedAccount[],
  videos: CollectedVideo[],
  games: GameRule[],
  since: string,
  today: string,
) {
  const byHandle = new Map(accounts.map((a) => [`${a.platform}:${a.handle.toLowerCase()}`, a]));
  const rows = [];
  const views = new Map<string, number>();
  let unmatched = 0;
  for (const v of videos) {
    if (v.publishedAt.slice(0, 10) < since) continue;
    // Скрейпер может вернуть один ролик дважды: в базу пишем один раз, с большими просмотрами.
    const key = `${v.platform}:${v.externalId}`;
    if (views.has(key)) { views.set(key, Math.max(views.get(key)!, v.views)); continue; }
    const acc = byHandle.get(`${v.platform}:${v.handle.toLowerCase()}`);
    if (!acc) { unmatched++; continue; }
    rows.push({
      campaign_id: campaignId, account_id: acc.id, platform: v.platform, external_id: v.externalId,
      url: v.url, caption: v.caption, published_at: v.publishedAt, game_id: assignGame(v.caption, mskDate(v.publishedAt), acc.game_id, games),
    });
    views.set(key, v.views);
  }

  let snapshots = 0;
  for (const part of chunk(rows, 500)) {
    const { data, error } = await db().from("videos").upsert(part, { onConflict: "campaign_id,platform,external_id" }).select("id,platform,external_id");
    if (error) throw new Error(`videos: ${error.message}`);
    const snap = (data ?? []).map((v) => ({ video_id: v.id, date: today, views: views.get(`${v.platform}:${v.external_id}`) ?? 0 }));
    const { error: e2 } = await db().from("video_snapshots").upsert(snap, { onConflict: "video_id,date" });
    if (e2) throw new Error(`snapshots: ${e2.message}`);
    snapshots += snap.length;
  }
  return { videos: rows.length, snapshots, unmatched };
}
