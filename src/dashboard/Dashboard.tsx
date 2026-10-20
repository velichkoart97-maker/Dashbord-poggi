// Порядок блоков на странице клиента. Чтобы убрать/переставить блок — правьте только этот файл.
import { HeaderBlock } from "@/blocks/header";
import { TopVideosBlock } from "@/blocks/top-videos";
import { PeriodFilterBlock } from "@/blocks/period-filter";
import { KpiBlock } from "@/blocks/kpi";
import { CreatorsBlock } from "@/blocks/creators";
import { PlatformShareBlock } from "@/blocks/platform-share";
import { TopChannelsBlock } from "@/blocks/top-channels";
import { DailyDynamicsBlock } from "@/blocks/daily-dynamics";
import { CpvBlock } from "@/blocks/cpv";
import { MonthlyBlock } from "@/blocks/monthly";
import { GamesBlock } from "@/blocks/games";
import type { BlockCtx } from "@/blocks/types";

export function Dashboard(ctx: BlockCtx) {
  return (
    <main className="page">
      <HeaderBlock {...ctx} />
      <TopVideosBlock {...ctx} />
      <PeriodFilterBlock {...ctx} />
      <KpiBlock {...ctx} />
      <CreatorsBlock {...ctx} />
      <div className="grid-2">
        <PlatformShareBlock {...ctx} />
        <TopChannelsBlock {...ctx} />
      </div>
      <DailyDynamicsBlock {...ctx} />
      <CpvBlock {...ctx} />
      <MonthlyBlock {...ctx} />
      <GamesBlock {...ctx} />
    </main>
  );
}
