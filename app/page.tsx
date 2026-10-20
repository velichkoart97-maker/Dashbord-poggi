// Страница клиента: /?t=<токен кампании>. Без верного токена — заглушка, данные не раскрываются.
import { Dashboard } from "@/dashboard/Dashboard";
import { getCampaignByToken } from "@/lib/db/queries";
import { resolveRange } from "@/lib/period";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const raw = await searchParams;
  const params = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const campaign = params.t ? await getCampaignByToken(params.t) : null;

  if (!campaign) {
    return (
      <main className="page" style={{ minHeight: "80vh", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>Нужна персональная ссылка</h1>
        <p style={{ color: "var(--muted)" }}>Откройте дашборд по ссылке, которую вам отправили.</p>
      </main>
    );
  }

  return <Dashboard campaign={campaign} range={resolveRange(params, campaign.start_date)} params={params} />;
}
