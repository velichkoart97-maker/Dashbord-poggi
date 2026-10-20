// Блок «Креаторы и публикаторы»: сравнение двух типов аккаунтов + раскрывающийся список публикаторов.
// Тип берётся из колонки «Тип» Google Таблицы; пока её нет, все аккаунты — креаторы.
import { fmtDate, fmtInt, fmtPct } from "@/lib/format";
import { Card, SectionTitle } from "@/ui/Card";
import ui from "@/ui/ui.module.css";
import type { BlockCtx } from "../types";
import { getCreatorsData } from "./data";
import s from "./styles.module.css";

export async function CreatorsBlock(ctx: BlockCtx) {
  const d = await getCreatorsData(ctx);
  const rows = [
    { name: "Креаторы", g: d.creators },
    { name: "Публикаторы", g: d.publishers },
  ];
  return (
    <>
      <SectionTitle title="Креаторы и публикаторы" note={`${fmtDate(ctx.range.from)} — ${fmtDate(ctx.range.to)}, ролики, опубликованные в периоде`} />
      <Card>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th></th>
                <th className={ui.right}>Просмотры</th>
                <th className={ui.right}>Доля</th>
                <th className={ui.right}>Публикации</th>
                <th className={ui.right}>Доля</th>
                <th className={ui.right}>Ср. охват</th>
                <th className={ui.right}>Аккаунтов</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ name, g }) => (
                <tr key={name}>
                  <td className={s.name}>{name}</td>
                  <td className={`${ui.right} num`}>{fmtInt(g.views)}</td>
                  <td className={`${ui.right} ${s.share}`}>{fmtPct(g.views, d.total.views)}</td>
                  <td className={`${ui.right} num`}>{fmtInt(g.posts)}</td>
                  <td className={`${ui.right} ${s.share}`}>{fmtPct(g.posts, d.total.posts)}</td>
                  <td className={`${ui.right} num`}>{fmtInt(g.posts ? g.views / g.posts : 0)}</td>
                  <td className={`${ui.right} num`}>{fmtInt(g.accounts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <details className={s.details}>
        <summary>Публикаторы подробно</summary>
        <Card>
          {d.publisherRows.length === 0 ? (
            <div className={ui.empty}>Публикаторов пока нет. Отметьте их в колонке «Тип» Google Таблицы.</div>
          ) : (
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <thead><tr><th>Аккаунт</th><th className={ui.right}>Просмотры</th><th className={ui.right}>Публикации</th></tr></thead>
                <tbody>
                  {d.publisherRows.map((r) => (
                    <tr key={r.handle}>
                      <td>{r.name ? `${r.name} · ` : ""}@{r.handle}</td>
                      <td className={`${ui.right} num`}>{fmtInt(r.views)}</td>
                      <td className={`${ui.right} num`}>{fmtInt(r.posts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </details>
    </>
  );
}
