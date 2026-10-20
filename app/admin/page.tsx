// Админка: настройки кампании, игры, клиентская ссылка, запуск сбора. Клиент её не видит.
import { headers } from "next/headers";
import { createCampaign, logout, regenerateToken, runCollectNow, saveCampaign, saveGames } from "@/admin/actions";
import { requireAdmin } from "@/admin/auth";
import s from "@/admin/admin.module.css";
import { db } from "@/lib/db/client";
import type { Campaign, Game } from "@/lib/db/types";
import { fmtDateTimeMsk } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ c?: string; ok?: string }> }) {
  await requireAdmin();
  const { c, ok } = await searchParams;

  const { data: campaigns } = await db().from("campaigns").select("*").order("created_at");
  const list = (campaigns ?? []) as Campaign[];
  const campaign = list.find((x) => x.slug === c) ?? list[0];
  if (!campaign) return <main className={s.wrap}><p>Нет кампаний. Выполните db/seed.sql.</p></main>;

  const [{ data: games }, { data: runs }, { count: accounts }] = await Promise.all([
    db().from("games").select("*").eq("campaign_id", campaign.id).order("sort"),
    db().from("collection_runs").select("*").eq("campaign_id", campaign.id).order("started_at", { ascending: false }).limit(7),
    db().from("accounts").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id),
  ]);
  const host = (await headers()).get("host");
  const clientUrl = `https://${host}/?t=${campaign.client_token}`;

  return (
    <main className={s.wrap}>
      <header className={s.top}>
        <h1>Админка</h1>
        <nav className={s.tabs}>
          {list.map((x) => <a key={x.slug} href={`/admin?c=${x.slug}`} className={x.slug === campaign.slug ? s.tabOn : s.tab}>{x.name}</a>)}
        </nav>
        <form action={logout}><button className={s.ghost}>Выйти</button></form>
      </header>
      {ok && <div className={s.ok}>{ok}</div>}

      <section className={s.card}>
        <h2>Ссылка для клиента</h2>
        <div className={s.linkRow}>
          <code className={s.link}>{clientUrl}</code>
          <a href={clientUrl} target="_blank" rel="noreferrer" className={s.ghost}>Открыть</a>
        </div>
        <form action={regenerateToken}>
          <input type="hidden" name="slug" value={campaign.slug} />
          <button className={s.ghost}>Выпустить новую ссылку (старая перестанет работать)</button>
        </form>
      </section>

      <section className={s.card}>
        <h2>Кампания</h2>
        <form action={saveCampaign} className={s.form}>
          <input type="hidden" name="slug" value={campaign.slug} />
          <label>Название<input name="name" defaultValue={campaign.name} className={s.input} /></label>
          <label>Бюджет, $<input name="budget_usd" defaultValue={campaign.budget_usd} className={s.input} inputMode="decimal" /></label>
          <label>Считать ролики с<input type="date" name="start_date" defaultValue={campaign.start_date} className={s.input} /></label>
          <label className={s.wide}>Google Таблица с аккаунтами
            <input name="sheet_url" defaultValue={campaign.sheet_url ?? ""} placeholder="https://docs.google.com/spreadsheets/d/…" className={s.input} />
            <small>Доступ «Все, у кого есть ссылка — читатель». Аккаунтов загружено: {accounts ?? 0}</small>
          </label>
          <label className={s.wide}>Google Таблица с отдельными роликами (необязательно)
            <input name="links_sheet_url" defaultValue={campaign.links_sheet_url ?? ""} placeholder="https://docs.google.com/spreadsheets/d/…" className={s.input} />
            <small>Ссылки на ролики (Reels, Shorts, TikTok). Аккаунты авторов добавятся сами, весь профиль не собирается.</small>
          </label>
          <button className={s.primary}>Сохранить</button>
        </form>
      </section>

      <section className={s.card}>
        <h2>Игры</h2>
        <p className={s.hint}>Игра ролика: игра аккаунта из колонки «Игра» в таблице → ключевое слово в подписи → игра с самой поздней датой начала, не позже публикации → текущая.</p>
        <form action={saveGames} className={s.games}>
          <input type="hidden" name="slug" value={campaign.slug} />
          <input type="hidden" name="campaign_id" value={campaign.id} />
          <div className={s.gameHead}><span>Текущая</span><span>Игра</span><span>Ключевые слова через запятую</span><span>С даты</span><span>Удалить</span></div>
          {((games ?? []) as Game[]).map((g) => (
            <div key={g.id} className={s.gameRow}>
              <input type="hidden" name="id" value={g.id} />
              <input type="radio" name="current" value={g.id} defaultChecked={g.is_current} />
              <input name={`name_${g.id}`} defaultValue={g.name} className={s.input} />
              <input name={`keywords_${g.id}`} defaultValue={g.keywords.join(", ")} className={s.input} />
              <input type="date" name={`starts_${g.id}`} defaultValue={g.starts_on ?? ""} className={s.input} />
              <input type="checkbox" name={`delete_${g.id}`} />
            </div>
          ))}
          <div className={s.gameRow}>
            <input type="radio" name="current" value="new" />
            <input name="new_name" placeholder="Новая игра" className={s.input} />
            <input name="new_keywords" placeholder="ключевые слова" className={s.input} />
            <input type="date" name="new_starts" className={s.input} />
            <span />
          </div>
          <button className={s.primary}>Сохранить игры</button>
        </form>
      </section>

      <section className={s.card}>
        <h2>Сбор данных</h2>
        <p className={s.hint}>Автоматически каждый день в 23:30 по МСК.</p>
        <form action={runCollectNow}>
          <input type="hidden" name="slug" value={campaign.slug} />
          <button className={s.primary}>Обновить сейчас</button>
        </form>
        <table className={s.runs}>
          <tbody>
            {(runs ?? []).map((r: { id: string; started_at: string; status: string; stats: Record<string, unknown> }) => (
              <tr key={r.id}>
                <td>{fmtDateTimeMsk(r.started_at)}</td>
                <td className={r.status === "ok" ? s.good : r.status === "running" ? "" : s.bad}>{r.status}</td>
                <td className={s.stats}>{Object.entries(r.stats ?? {}).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={s.card}>
        <h2>Новая кампания</h2>
        <form action={createCampaign} className={s.form}>
          <label>Название<input name="name" placeholder="Клиент" className={s.input} /></label>
          <label>slug (латиница)<input name="slug" placeholder="client-name" className={s.input} /></label>
          <button className={s.primary}>Создать</button>
        </form>
      </section>
    </main>
  );
}
