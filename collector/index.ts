// Ежедневный сбор: для каждой кампании читает Google Таблицу, собирает ролики по платформам, пишет снимок просмотров.
// Запуск: npm run collect (локально с .env) или GitHub Actions (.github/workflows/collect.yml).
// Локально ключи берутся из .env (в GitHub Actions — из секретов).
try { process.loadEnvFile(".env"); } catch {}

import { db } from "../src/lib/db/client";
import { todayMsk } from "../src/lib/period";
import type { Campaign, Game } from "../src/lib/db/types";
import { COLLECTORS } from "./platforms";
import { saveAccounts, saveVideos } from "./save";
import { readSheet } from "./sheet";
import { collectLinks, readLinks } from "./links";
import type { CollectedVideo, SheetAccount } from "./types";

async function collectCampaign(c: Campaign) {
  const { data: run } = await db().from("collection_runs").insert({ campaign_id: c.id }).select("id").single();
  const stats: Record<string, unknown> = {};
  let status = "ok";
  try {
    if (!c.sheet_url) throw new Error("Не задана Google Таблица");
    const { accounts, skipped } = await readSheet(c.sheet_url);
    stats.accounts = accounts.length;
    if (skipped.length) stats.skipped = skipped.length;
    const { data: gameRows } = await db().from("games").select("*").eq("campaign_id", c.id);
    const games = (gameRows ?? []) as Game[];

    const videos: CollectedVideo[] = [];
    const platforms = [...new Set(accounts.map((a) => a.platform))];
    for (const p of platforms) {
      const list = accounts.filter((a) => a.platform === p);
      const collect = COLLECTORS[p];
      if (!collect) { stats[p] = `заглушка (${list.length} акк.)`; continue; }
      try {
        const got = await collect(list, c.start_date);
        stats[p] = got.length;
        videos.push(...got);
      } catch (e) {
        status = "partial";
        stats[p] = `ошибка: ${(e as Error).message.slice(0, 200)}`;
        console.error(`[${c.slug}] ${p}:`, e);
      }
    }

    // Отдельные ролики по ссылкам: ошибка здесь не мешает основному сбору.
    const extra: SheetAccount[] = [];
    if (c.links_sheet_url) {
      try {
        const links = await readLinks(c.links_sheet_url);
        stats.links = links.length;
        const got = await collectLinks(links, accounts, stats);
        videos.push(...got.videos);
        extra.push(...got.accounts);
      } catch (e) {
        status = "partial";
        stats.links = `ошибка: ${(e as Error).message.slice(0, 200)}`;
        console.error(`[${c.slug}] links:`, e);
      }
    }

    const saved = await saveAccounts(c.id, [...accounts, ...extra], games);
    const res = await saveVideos(c.id, saved, videos, games, c.start_date, todayMsk());
    Object.assign(stats, res);
  } catch (e) {
    status = "failed";
    stats.error = (e as Error).message.slice(0, 300);
    console.error(`[${c.slug}]`, e);
  }
  await db().from("collection_runs").update({ status, stats, finished_at: new Date().toISOString() }).eq("id", run!.id);
  console.log(`[${c.slug}] ${status}`, stats);
  return status;
}

async function main() {
  const only = process.argv[2]; // npm run collect -- poggiplay
  const { data, error } = await db().from("campaigns").select("*");
  if (error) throw new Error(error.message);
  const campaigns = ((data ?? []) as Campaign[]).filter((c) => !only || c.slug === only);
  const results = [];
  for (const c of campaigns) results.push(await collectCampaign(c));
  if (results.includes("failed")) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
