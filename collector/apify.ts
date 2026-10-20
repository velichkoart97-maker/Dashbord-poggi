// Минимальный клиент Apify REST API: запустить актор, дождаться, забрать результаты.
const API = "https://api.apify.com/v2";

function token() {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN не задан");
  return t;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runActor<T>(actorId: string, input: unknown, opts: { timeoutMin?: number } = {}): Promise<T[]> {
  const actor = actorId.replace("/", "~");
  const start = await fetch(`${API}/acts/${actor}/runs?token=${token()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!start.ok) throw new Error(`Apify ${actorId}: запуск не удался (${start.status}) ${await start.text()}`);
  const run = (await start.json()).data as { id: string; defaultDatasetId: string };

  const deadline = Date.now() + (opts.timeoutMin ?? 60) * 60_000;
  for (;;) {
    await sleep(15_000);
    const res = await fetch(`${API}/actor-runs/${run.id}?token=${token()}`);
    const status = (await res.json()).data?.status as string;
    if (status === "SUCCEEDED") break;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) throw new Error(`Apify ${actorId}: прогон ${status}`);
    if (Date.now() > deadline) throw new Error(`Apify ${actorId}: не дождались результата`);
  }

  const items: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${API}/datasets/${run.defaultDatasetId}/items?clean=true&format=json&offset=${offset}&limit=1000&token=${token()}`);
    const page = (await res.json()) as T[];
    items.push(...page);
    if (page.length < 1000) return items;
  }
}

export function chunk<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}
