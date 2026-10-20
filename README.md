# UGC-дашборд WWMAAI × PoggiPlay

Клиент открывает дашборд по ссылке `https://<домен>/?t=<токен>`. Настройки (бюджет, игры, таблица аккаунтов) — в `/admin`, клиент их не видит. Данные собираются каждый день в 23:30 МСК.

Как устроен код — см. [CLAUDE.md](CLAUDE.md).

## Запуск (один раз)

1. **Supabase** (бесплатно): создать проект на supabase.com → SQL Editor → выполнить `db/schema.sql`, затем `db/seed.sql`.
   Из Project Settings → API взять `Project URL` и `service_role` key.
2. **Google Таблица**: в первой колонке — ссылки на аккаунты (Instagram, TikTok, YouTube). Можно добавить колонки «ФИО» и «Тип» (креатор/публикатор).
   Доступ: «Все, у кого есть ссылка — читатель».
3. **Apify**: зарегистрироваться на apify.com, Settings → Integrations → API token.
4. **YouTube Data API**: Google Cloud Console → включить YouTube Data API v3 → создать API key.
5. **Vercel**: Import репозитория → Environment Variables:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SECRET` (любая длинная строка),
   по желанию `GITHUB_DISPATCH_TOKEN` + `GITHUB_REPO` для кнопки «Обновить сейчас».
6. **GitHub → Settings → Secrets and variables → Actions**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APIFY_TOKEN`, `YOUTUBE_API_KEY`.
7. Открыть `/admin`, вставить ссылку на таблицу, проверить бюджет и игры, нажать «Обновить сейчас» (или Actions → Collect → Run workflow).
   Ссылку для клиента взять там же.

## Локально

```bash
npm install
DEMO_DATA=1 npm run dev        # дашборд на демо-данных: http://localhost:3000/?t=demo
cp .env.example .env           # для работы с настоящей базой
npm run collect                # ручной сбор (нужны ключи в .env)
```
