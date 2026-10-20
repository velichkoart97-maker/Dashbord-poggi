"use server";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { checkPassword, endSession, requireAdmin, startSession } from "./auth";

const newToken = () => randomBytes(9).toString("base64url");
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const done = (slug: string, msg: string): never => { revalidatePath("/admin"); redirect(`/admin?c=${slug}&ok=${encodeURIComponent(msg)}`); };

export async function login(form: FormData) {
  if (!checkPassword(str(form, "password"))) redirect("/admin/login?error=1");
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function saveCampaign(form: FormData) {
  await requireAdmin();
  const slug = str(form, "slug");
  const { error } = await db().from("campaigns").update({
    name: str(form, "name"),
    budget_usd: Number(str(form, "budget_usd").replace(/[^\d.]/g, "")) || 0,
    start_date: str(form, "start_date"),
    sheet_url: str(form, "sheet_url") || null,
  }).eq("slug", slug);
  if (error) throw new Error(error.message);
  done(slug, "Настройки сохранены");
}

export async function regenerateToken(form: FormData) {
  await requireAdmin();
  const slug = str(form, "slug");
  const { error } = await db().from("campaigns").update({ client_token: newToken() }).eq("slug", slug);
  if (error) throw new Error(error.message);
  done(slug, "Новая ссылка создана, старая больше не работает");
}

export async function createCampaign(form: FormData) {
  await requireAdmin();
  const name = str(form, "name");
  const slug = str(form, "slug").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!name || !slug) throw new Error("Нужны название и slug");
  const { error } = await db().from("campaigns").insert({
    name, slug, client_token: newToken(), start_date: new Date().toISOString().slice(0, 10), budget_usd: 0,
  });
  if (error) throw new Error(error.message);
  done(slug, "Кампания создана");
}

// Игры: одна форма на все строки (name_<id>, keywords_<id>, current=<id>, delete_<id>) + новая строка.
export async function saveGames(form: FormData) {
  await requireAdmin();
  const slug = str(form, "slug");
  const campaignId = str(form, "campaign_id");
  const current = str(form, "current");
  const ids = form.getAll("id").map(String);
  const kw = (s: string) => s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

  for (const [i, id] of ids.entries()) {
    if (form.get(`delete_${id}`)) {
      await db().from("games").delete().eq("id", id);
      continue;
    }
    await db().from("games").update({
      name: str(form, `name_${id}`), keywords: kw(str(form, `keywords_${id}`)), is_current: id === current, sort: i,
    }).eq("id", id);
  }

  const newName = str(form, "new_name");
  if (newName) {
    await db().from("games").insert({
      campaign_id: campaignId, name: newName, keywords: kw(str(form, "new_keywords") || newName),
      is_current: current === "new", sort: ids.length,
    });
  }
  done(slug, "Игры сохранены. Ролики перераспределятся при следующем сборе");
}

// «Обновить сейчас»: запускает GitHub Actions workflow сборщика.
export async function runCollectNow(form: FormData) {
  await requireAdmin();
  const slug = str(form, "slug");
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) done(slug, "Кнопка не настроена: нужны GITHUB_DISPATCH_TOKEN и GITHUB_REPO");
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/collect.yml/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    body: JSON.stringify({ ref: "main" }),
  });
  done(slug, res.ok ? "Сбор запущен, данные обновятся в течение часа" : `GitHub ответил ${res.status}`);
}
