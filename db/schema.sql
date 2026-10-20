-- Схема базы. Выполнить один раз в Supabase → SQL Editor.
-- Повторный запуск безопасен (if not exists / or replace).

create extension if not exists pgcrypto;

-- Кампания = один клиентский дашборд со своей ссылкой.
create table if not exists campaigns (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,                 -- «PoggiPlay»
  client_token  text unique not null,          -- ссылка клиента: /?t=<client_token>
  sheet_url     text,                          -- Google Таблица со списком аккаунтов
  start_date    date not null,                 -- с какой даты считаем ролики
  budget_usd    numeric not null default 0,
  created_at    timestamptz not null default now()
);

-- Игры кампании. Ровно одна is_current: в неё попадают все ролики без явной метки.
create table if not exists games (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  name         text not null,
  keywords     text[] not null default '{}',   -- слова/хэштеги в подписи, по которым ролик относится к игре
  is_current   boolean not null default false,
  sort         int not null default 0
);
-- Дата начала игры: ролик без игры у аккаунта и без ключевого слова идёт в игру с самой поздней датой начала ≤ даты публикации.
alter table games add column if not exists starts_on date;

-- Аккаунты из Google Таблицы.
create table if not exists accounts (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  url          text not null,
  platform     text not null,                  -- instagram | tiktok | youtube | ...
  handle       text not null,                  -- ник без @
  full_name    text,                           -- ФИО (необязательная колонка таблицы)
  kind         text not null default 'creator' check (kind in ('creator','publisher')),
  sheet_row    int,
  active       boolean not null default true,
  unique (campaign_id, url)
);
-- Игра аккаунта (колонка «Игра» в таблице): все его ролики идут в неё.
alter table accounts add column if not exists game_id uuid references games(id) on delete set null;

-- Ролики.
create table if not exists videos (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  account_id    uuid not null references accounts(id) on delete cascade,
  platform      text not null,
  external_id   text not null,
  url           text not null,
  caption       text,
  published_at  timestamptz not null,
  game_id       uuid references games(id) on delete set null,
  unique (campaign_id, platform, external_id)
);
create index if not exists videos_campaign_idx on videos (campaign_id, published_at);

-- Снимок просмотров ролика на дату (одна строка на ролик в день).
create table if not exists video_snapshots (
  video_id  uuid not null references videos(id) on delete cascade,
  date      date not null,
  views     bigint not null,
  primary key (video_id, date)
);

-- Журнал запусков сбора.
create table if not exists collection_runs (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid references campaigns(id) on delete cascade,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running',  -- running | ok | partial | failed
  stats        jsonb not null default '{}'
);

-- Доступ только через service role (сервер дашборда и сборщик).
alter table campaigns       enable row level security;
alter table games           enable row level security;
alter table accounts        enable row level security;
alter table videos          enable row level security;
alter table video_snapshots enable row level security;
alter table collection_runs enable row level security;

-- Ролик + его последние просмотры.
create or replace view video_latest with (security_invoker = true) as
select v.*, a.handle, a.full_name, a.kind, coalesce(s.views, 0) as views
from videos v
join accounts a on a.id = v.account_id
left join lateral (
  select views from video_snapshots where video_id = v.id order by date desc limit 1
) s on true;

-- Новые просмотры по дням и платформам.
-- Первый снимок ролика относим на дату публикации (по МСК), дальше — прирост между снимками.
create or replace view daily_views with (security_invoker = true) as
with d as (
  select s.video_id, s.date, s.views,
         lag(s.views) over (partition by s.video_id order by s.date) as prev
  from video_snapshots s
)
select v.campaign_id,
       v.platform,
       case when d.prev is null
            then least(d.date, (v.published_at at time zone 'Europe/Moscow')::date)
            else d.date end as date,
       sum(case when d.prev is null then d.views else greatest(d.views - d.prev, 0) end)::bigint as new_views
from d
join videos v on v.id = d.video_id
group by 1, 2, 3;
