// Блок «Шапка»: логотипы WWMAAI × PoggiPlay, расписание и время последнего обновления.
import { getLastRun } from "@/lib/db/queries";
import { fmtDateTimeMsk } from "@/lib/format";
import { WwmaaiLogo } from "@/ui/logos/WwmaaiLogo";
import { PoggiLogo } from "@/ui/logos/PoggiLogo";
import type { BlockCtx } from "../types";
import s from "./styles.module.css";

export async function HeaderBlock({ campaign }: BlockCtx) {
  const run = await getLastRun(campaign.id);
  return (
    <header className={s.header}>
      <div className={s.brand}>
        <WwmaaiLogo height={30} />
        <span className={s.x}>×</span>
        <PoggiLogo height={42} />
      </div>
      <div className={s.meta}>
        <span className={s.chip}><span className={s.dot} /> Обновляется ежедневно в 23:30 по МСК</span>
        <span className={s.updated}>
          Обновлено: {run?.finished_at ? fmtDateTimeMsk(run.finished_at) : "ещё не было"}
        </span>
      </div>
    </header>
  );
}
