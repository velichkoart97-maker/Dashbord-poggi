// Instagram через HikerAPI (api.hikerapi.com, секрет HIKERAPI_KEY): сервис собирает своими аккаунтами
// и прокси и отдаёт все ролики профиля с просмотрами, даже когда без входа Instagram показывает не всё.
// Каждый запрос платный, поэтому листаем только до даты старта.
import type { CollectedVideo, SheetAccount } from "../types";

const BASE = "https://api.hikerapi.com";

type Media = {
  code?: string; taken_at?: string | number; media_type?: number; product_type?: string;
  play_count?: number; ig_play_count?: number; view_count?: number; video_view_count?: number;
  caption_text?: string; caption?: { text?: string } | string | null; user?: { username?: string };
};

async function hiker<T>(path: string, key: string): Promise<T> {
  // Ключ передаём и заголовком, и параметром access_key: сервис принимает оба способа.
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}access_key=${encodeURIComponent(key.trim())}`;
  const res = await fetch(url, { headers: { "x-access-key": key.trim(), accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path.split("?")[0]}: ${res.status} ${text.slice(0, 150)}`);
  return JSON.parse(text) as T;
}

const toIso = (t: string | number) => (typeof t === "number" ? new Date(t * 1000).toISOString() : new Date(t).toISOString());

// Chunk-ответ HikerAPI — пара [ролики, курсор]; на всякий случай понимаем и объект.
function unpack(r: unknown): { items: Media[]; cursor: string | null } {
  if (Array.isArray(r) && Array.isArray(r[0])) return { items: r[0] as Media[], cursor: (r[1] as string) || null };
  if (Array.isArray(r)) return { items: r as Media[], cursor: null };
  const o = r as { items?: Media[]; response?: { items?: Media[] }; next_page_id?: string; end_cursor?: string };
  return { items: o.items ?? o.response?.items ?? [], cursor: o.next_page_id ?? o.end_cursor ?? null };
}

export async function collectInstagramHiker(accounts: SheetAccount[], since: string, key: string): Promise<CollectedVideo[]> {
  const out: CollectedVideo[] = [];
  let logged = false;
  for (const a of accounts) {
    try {
      const user = await hiker<{ pk?: string | number; id?: string }>(`/v1/user/by/username?username=${encodeURIComponent(a.handle)}`, key);
      const id = user.pk ?? user.id;
      if (!id) throw new Error("профиль не найден");
      let cursor: string | null = null;
      let n = 0;
      for (let page = 0; page < 10; page++) {
        const { items, cursor: next } = unpack(await hiker(`/v1/user/clips/chunk?user_id=${id}${cursor ? `&end_cursor=${encodeURIComponent(cursor)}` : ""}`, key));
        if (!logged && items[0]) { console.log(`HikerAPI: поля ролика: ${Object.keys(items[0]).slice(0, 30).join(",")}`); logged = true; }
        let older = false;
        for (const m of items) {
          if (!m.code || m.taken_at == null) continue;
          const publishedAt = toIso(m.taken_at);
          if (publishedAt.slice(0, 10) < since) { older = true; continue; }
          out.push({
            platform: "instagram",
            handle: m.user?.username || a.handle,
            externalId: m.code,
            url: `https://www.instagram.com/reel/${m.code}/`,
            caption: m.caption_text ?? (typeof m.caption === "string" ? m.caption : m.caption?.text) ?? "",
            publishedAt,
            views: m.play_count ?? m.ig_play_count ?? m.view_count ?? m.video_view_count ?? 0,
          });
          n++;
        }
        if (older || !next || !items.length) break;
        cursor = next;
      }
      console.log(`HikerAPI: ${a.handle} — ${n} роликов`);
    } catch (e) {
      console.warn(`HikerAPI: ${a.handle}: ${(e as Error).message.slice(0, 200)}`);
    }
  }
  return out;
}
