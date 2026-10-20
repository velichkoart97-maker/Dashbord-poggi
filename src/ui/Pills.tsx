"use client";
import Link from "next/link";
import s from "./ui.module.css";

type Opt<T extends string> = { value: T; label: string };

// Переключатель-«пилюли» с локальным состоянием.
export function Pills<T extends string>({ options, value, onChange }: {
  options: Opt<T>[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className={s.pills}>
      {options.map((o) => (
        <button key={o.value} type="button"
          className={`${s.pill} ${o.value === value ? s.pillActive : ""}`}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Те же пилюли, но каждая — ссылка (для фильтров, которые живут в URL).
export function LinkPills({ options, active }: { options: { href: string; label: string; key: string }[]; active: string }) {
  return (
    <div className={s.pills}>
      {options.map((o) => (
        <Link key={o.key} href={o.href} scroll={false}
          className={`${s.pill} ${o.key === active ? s.pillActive : ""}`}>
          {o.label}
        </Link>
      ))}
    </div>
  );
}
