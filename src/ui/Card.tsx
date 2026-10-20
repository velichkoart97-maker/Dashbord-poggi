import type { ReactNode } from "react";
import s from "./ui.module.css";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`${s.card} ${className}`}>{children}</section>;
}

// Заголовок раздела над карточкой: «Динамика по дням — подпись»
export function SectionTitle({ title, note }: { title: string; note?: ReactNode }) {
  return (
    <h2 className={s.sectionTitle}>
      {title}
      {note && <span className={s.sectionNote}> — {note}</span>}
    </h2>
  );
}

// Мелкий капс-заголовок внутри карточки
export function CardLabel({ children }: { children: ReactNode }) {
  return <div className={s.cardLabel}>{children}</div>;
}
