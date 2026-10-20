// Реестр сборщиков. Платформы без сборщика — заглушки (аккаунты сохраняются, ролики не собираются).
// Подключить новую платформу: файл в этой папке + строка здесь + enabled: true в src/config/platforms.ts.
import type { PlatformId } from "../../src/config/platforms";
import type { PlatformCollector } from "../types";
import { collectInstagram } from "./instagram";
import { collectTikTok } from "./tiktok";
import { collectYouTube } from "./youtube";

export const COLLECTORS: Partial<Record<PlatformId, PlatformCollector>> = {
  instagram: collectInstagram,
  tiktok: collectTikTok,
  youtube: collectYouTube,
};
