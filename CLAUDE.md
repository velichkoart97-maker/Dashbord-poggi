# Карта проекта (читать первой, остальное — только нужную папку)

UGC-дашборд WWMAAI × PoggiPlay. Next.js 15 (App Router) + Supabase + сборщик в GitHub Actions.
Правило: правка блока = только его папка `src/blocks/<блок>/`. Весь проект читать не нужно.

| Что меняем | Где |
| --- | --- |
| Порядок/набор блоков на странице | `src/dashboard/Dashboard.tsx` |
| Конкретный блок | `src/blocks/<блок>/` — `index.tsx` (разметка), `data.ts` (расчёт), `*.tsx` (клиентский график), `styles.module.css` |
| Цвета, шрифты, общий стиль | `src/ui/theme.css` (токены), `src/ui/ui.module.css` (карточки, пилюли, таблицы) |
| Логотипы | `src/ui/logos/` |
| Платформы (подпись, цвет, вкл/заглушка) | `src/config/platforms.ts` |
| Общие запросы к базе | `src/lib/db/queries.ts` (кешируются на рендер) |
| Фильтр периода, форматирование | `src/lib/period.ts`, `src/lib/format.ts` |
| Админка | `app/admin/page.tsx`, `src/admin/actions.ts`, `src/admin/auth.ts` |
| Сбор данных | `collector/index.ts` (оркестратор), `collector/platforms/<платформа>.ts`, `collector/sheet.ts`, `collector/links.ts` (ролики по ссылкам из второй таблицы), `collector/games.ts`, `collector/save.ts` |
| Расписание сбора | `.github/workflows/collect.yml` (20:30 UTC = 23:30 МСК) |
| Схема базы | `db/schema.sql`, `db/seed.sql` |

Блоки: `header`, `top-videos`, `period-filter`, `kpi`, `creators`, `platform-share`, `top-channels`, `daily-dynamics`, `cpv`, `monthly`, `games`.
Каждый блок получает `BlockCtx` (`src/blocks/types.ts`): кампания, период из URL, параметры.

## Данные
- `video_snapshots` — просмотры ролика на дату (один снимок в день). View `daily_views` превращает снимки в «новые просмотры за день»: первый снимок относится на дату публикации.
- View `video_latest` — ролик + последние просмотры + аккаунт.
- CPV = бюджет ÷ все просмотры кампании, накопленные к дате. Деньги — в долларах.
- Игра ролика: игра аккаунта (колонка «Игра» в таблице) → ключевое слово другой игры в подписи → игра с самой поздней `starts_on` ≤ даты публикации → текущая (`collector/games.ts`).

## Проверка
- `npm run typecheck`, `npm run build`.
- Без базы: `DEMO_DATA=1 npm run dev` → http://localhost:3000/?t=demo (демо-данные `src/lib/db/demo.ts`).
