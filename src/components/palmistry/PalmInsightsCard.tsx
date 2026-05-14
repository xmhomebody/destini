"use client";

import { useT } from "@/lib/i18n";

const principleKeys = ["heart", "head", "life", "fate", "marriage"] as const;

type Area = { key: string; svg: React.ReactElement };
const areas: Area[] = [
  {
    key: "palm.area.jupiter",
    svg: <circle cx="8" cy="8" r="3" strokeWidth="1.5" />,
  },
  {
    key: "palm.area.saturn",
    svg: <circle cx="12" cy="6" r="3" strokeWidth="1.5" />,
  },
  {
    key: "palm.area.apollo",
    svg: <circle cx="16" cy="8" r="3" strokeWidth="1.5" />,
  },
  {
    key: "palm.area.mercury",
    svg: <circle cx="18" cy="11" r="2.5" strokeWidth="1.5" />,
  },
  {
    key: "palm.area.mars",
    svg: <path d="M8 12h8M12 9v6" strokeWidth="1.5" />,
  },
  {
    key: "palm.area.venus",
    svg: <path d="M6 14a4 4 0 014-4v8a4 4 0 01-4-4z" strokeWidth="1.5" />,
  },
  {
    key: "palm.area.luna",
    svg: <path d="M18 14a4 4 0 00-4-4v8a4 4 0 004-4z" strokeWidth="1.5" />,
  },
  {
    key: "palm.area.wrist",
    svg: <path d="M5 19q7 3 14 0" strokeWidth="1.5" />,
  },
];

export function PalmInsightsCard() {
  const t = useT();
  return (
    <section className="ornate-card px-6 py-7">
      <div className="flex items-center mb-5" aria-hidden>
        <span className="flex-1 h-px bg-gold/40" />
        <h2 className="mx-3 font-[family-name:var(--font-cinzel)] text-base tracking-[0.2em] uppercase text-cinnabar">
          {t("palm.insights")}
        </h2>
        <span className="flex-1 h-px bg-gold/40" />
      </div>

      <h3 className="text-[11px] tracking-[0.2em] uppercase text-cinnabar pb-2 mb-3 border-b border-gold/30">
        {t("palm.five_lines")}
      </h3>
      <ul className="space-y-3">
        {principleKeys.map((k, i) => (
          <li key={k} className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full border border-gold bg-parchment-soft text-ink-dark flex items-center justify-center text-xs font-[family-name:var(--font-cinzel)]">
              {i + 1}
            </span>
            <p className="text-sm text-ink-dark leading-relaxed">
              <span className="font-medium text-ink-dark">
                {t(`palm.principle.${k}.title`)}
              </span>{" "}
              <span className="text-ink-light">
                {t(`palm.principle.${k}.body`)}
              </span>
            </p>
          </li>
        ))}
      </ul>

      <div className="relative my-6" aria-hidden>
        <span className="block h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border border-gold bg-parchment" />
      </div>

      <h3 className="text-[11px] tracking-[0.2em] uppercase text-cinnabar pb-2 mb-3 border-b border-gold/30">
        {t("palm.mounts")}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-ink-dark">
        {areas.map((a) => (
          <div
            key={a.key}
            className="flex items-center gap-2.5 border-b border-dashed border-gold/30 pb-2"
          >
            <svg
              aria-hidden
              className="w-5 h-5 text-ink-light shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {a.svg}
            </svg>
            <span>{t(a.key)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
