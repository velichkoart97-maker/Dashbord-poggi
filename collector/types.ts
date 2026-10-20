import type { PlatformId } from "../src/config/platforms";

// Аккаунт из Google Таблицы.
export type SheetAccount = {
  row: number;
  url: string;
  platform: PlatformId;
  handle: string;
  fullName: string | null;
  kind: "creator" | "publisher";
  game: string | null; // название игры из колонки «Игра»
};

// Ролик, который вернул сборщик платформы. handle — чей ролик (сопоставляется с аккаунтом).
export type CollectedVideo = {
  platform: PlatformId;
  handle: string;
  externalId: string;
  url: string;
  caption: string;
  publishedAt: string; // ISO
  views: number;
};

// Каждая платформа реализует одну функцию: аккаунты + дата старта → ролики с текущими просмотрами.
export type PlatformCollector = (accounts: SheetAccount[], since: string) => Promise<CollectedVideo[]>;
