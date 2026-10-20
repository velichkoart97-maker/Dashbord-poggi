import { PLATFORM_BY_ID, type PlatformId } from "@/config/platforms";
import s from "./ui.module.css";

export function PlatformBadge({ id }: { id: PlatformId }) {
  const p = PLATFORM_BY_ID[id];
  return (
    <span className={s.badge} style={{ color: p.color, background: `${p.color}1f`, borderColor: `${p.color}40` }}>
      {p.label}
    </span>
  );
}
