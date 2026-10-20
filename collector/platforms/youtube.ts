// YouTube: официальный YouTube Data API v3 (бесплатная квота 10 000 единиц/день; ~3 единицы на канал).
import { chunk } from "../apify";
import type { CollectedVideo, PlatformCollector } from "../types";

const API = "https://www.googleapis.com/youtube/v3";

export async function ytApi<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY не задан");
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key })}`);
  if (!res.ok) throw new Error(`YouTube API ${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function uploadsPlaylist(handle: string): Promise<string | null> {
  const by: Record<string, string> = handle.startsWith("UC") ? { id: handle } : { forHandle: handle };
  const r = await ytApi<{ items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[] }>("channels", { part: "contentDetails", ...by });
  return r.items?.[0]?.contentDetails.relatedPlaylists.uploads ?? null;
}

export const collectYouTube: PlatformCollector = async (accounts, since) => {
  const out: CollectedVideo[] = [];
  const failed: string[] = [];
  for (const acc of accounts) {
    try { out.push(...(await collectChannel(acc.handle, since))); }
    catch (e) {
      // Канал без роликов отдаёт 404 на плейлист загрузок — это не повод терять остальные каналы.
      failed.push(acc.url);
      console.warn(`YouTube: ${acc.url}: ${(e as Error).message.slice(0, 200)}`);
    }
  }
  if (failed.length === accounts.length && accounts.length) throw new Error(`все каналы с ошибкой, например ${failed[0]}`);
  return out;
};

async function collectChannel(handle: string, since: string): Promise<CollectedVideo[]> {
  const out: CollectedVideo[] = [];
  const playlist = await uploadsPlaylist(handle);
  if (!playlist) { console.warn(`YouTube: канал не найден @${handle}`); return out; }

  // Плейлист загрузок идёт от новых к старым — листаем до даты старта.
  const ids: string[] = [];
  let pageToken = "";
  for (;;) {
    const r = await ytApi<{ nextPageToken?: string; items: { contentDetails: { videoId: string; videoPublishedAt?: string } }[] }>(
      "playlistItems", { part: "contentDetails", playlistId: playlist, maxResults: "50", ...(pageToken ? { pageToken } : {}) });
    let reachedOld = false;
    for (const it of r.items) {
      const at = it.contentDetails.videoPublishedAt;
      if (at && at.slice(0, 10) < since) { reachedOld = true; break; }
      ids.push(it.contentDetails.videoId);
    }
    if (reachedOld || !r.nextPageToken) break;
    pageToken = r.nextPageToken;
  }

  for (const batch of chunk(ids, 50)) {
    const r = await ytApi<{ items: { id: string; snippet: { title: string; publishedAt: string }; statistics: { viewCount?: string } }[] }>(
      "videos", { part: "snippet,statistics", id: batch.join(",") });
    for (const v of r.items) {
      out.push({
        platform: "youtube",
        handle,
        externalId: v.id,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        caption: v.snippet.title,
        publishedAt: v.snippet.publishedAt,
        views: Number(v.statistics.viewCount ?? 0),
      });
    }
  }
  return out;
}
