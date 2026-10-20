import type { PlatformId } from "../src/config/platforms";

// Ник аккаунта из ссылки на профиль. Для YouTube возвращаем "@handle" или "UC…" (id канала).
export function handleFromUrl(platform: PlatformId, url: string): string | null {
  let u: URL;
  try { u = new URL(url.trim()); } catch { return null; }
  const parts = u.pathname.split("/").filter(Boolean);
  switch (platform) {
    case "instagram":
      return parts[0] && !["p", "reel", "reels", "stories"].includes(parts[0]) ? parts[0].replace(/^@/, "") : null;
    case "tiktok":
      return parts[0]?.startsWith("@") ? parts[0].slice(1) : null;
    case "youtube":
      if (parts[0]?.startsWith("@")) return parts[0];
      if (parts[0] === "channel" && parts[1]) return parts[1];
      if ((parts[0] === "c" || parts[0] === "user") && parts[1]) return `@${parts[1]}`;
      return null;
    default:
      return parts[parts.length - 1]?.replace(/^@/, "") ?? null;
  }
}
