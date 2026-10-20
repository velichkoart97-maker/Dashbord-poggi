-- Стартовая кампания PoggiPlay. Выполнить после schema.sql.
-- Ссылка клиента после вставки: select client_token from campaigns where slug = 'poggiplay';

insert into campaigns (slug, name, client_token, start_date, budget_usd)
values ('poggiplay', 'PoggiPlay', translate(encode(gen_random_bytes(9), 'base64'), '+/', '-_'), '2026-08-05', 20000)
on conflict (slug) do nothing;

insert into games (campaign_id, name, keywords, is_current, sort)
select c.id, g.name, g.keywords, g.is_current, g.sort
from campaigns c,
     (values ('BirdUp',        array['birdup','bird up'],        true,  0),
             ('Buffalo',       array['buffalo'],                 false, 1),
             ('Indiana Mines', array['indiana mines','indianamines'], false, 2)
     ) as g(name, keywords, is_current, sort)
where c.slug = 'poggiplay'
  and not exists (select 1 from games where campaign_id = c.id);
