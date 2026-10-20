// Единый список платформ: подпись, цвет и подключён ли сбор.
// Добавить платформу = строка здесь + сборщик в collector/platforms/.

export type PlatformId =
  | "instagram" | "tiktok" | "youtube" | "likee" | "vk"
  | "wibes" | "yappy" | "ok" | "dzen" | "threads";

export type Platform = {
  id: PlatformId;
  label: string;
  color: string;
  enabled: boolean; // false = заглушка: есть в легендах, данных нет
};

export const PLATFORMS: Platform[] = [
  { id: "instagram", label: "Instagram",     color: "#F0607E", enabled: true },
  { id: "tiktok",    label: "TikTok",        color: "#6FD6D2", enabled: true },
  { id: "youtube",   label: "YouTube",       color: "#FF8A3D", enabled: true },
  { id: "likee",     label: "Likee",         color: "#8BD97A", enabled: false },
  { id: "vk",        label: "VK Clips",      color: "#5B8DEF", enabled: false },
  { id: "wibes",     label: "Wibes",         color: "#F2C14E", enabled: false },
  { id: "yappy",     label: "Yappy",         color: "#B07CF0", enabled: false },
  { id: "ok",        label: "Одноклассники", color: "#E9A15B", enabled: false },
  { id: "dzen",      label: "Дзен",          color: "#9A928C", enabled: false },
  { id: "threads",   label: "Threads",       color: "#EDE6E0", enabled: false },
];

export const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<PlatformId, Platform>;

export function platformFromUrl(url: string): PlatformId | null {
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("likee.")) return "likee";
  if (u.includes("vk.com") || u.includes("vkvideo.ru")) return "vk";
  if (u.includes("wibes.")) return "wibes";
  if (u.includes("yappy")) return "yappy";
  if (u.includes("ok.ru")) return "ok";
  if (u.includes("dzen.ru")) return "dzen";
  if (u.includes("threads.")) return "threads";
  return null;
}
