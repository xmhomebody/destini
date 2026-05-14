"use client";

import { useT } from "@/lib/i18n";

const principleKeys = ["forehead", "eyes", "nose", "mouth"] as const;

type Area = { key: string; svg: React.ReactElement };
const areas: Area[] = [
  {
    key: "face.area.forehead",
    svg: <path d="M7 8a5 5 0 0 1 10 0" strokeWidth="1.5" />,
  },
  {
    key: "face.area.cheeks",
    svg: <circle cx="12" cy="12" r="5" strokeWidth="1.5" />,
  },
  {
    key: "face.area.brows",
    svg: <path d="M6 10Q12 6 18 10" strokeWidth="1.5" />,
  },
  {
    key: "face.area.mouth",
    svg: <path d="M7 14Q12 18 17 14" strokeWidth="1.5" />,
  },
  {
    key: "face.area.eyes",
    svg: (
      <>
        <path d="M4 12C4 12 8 16 12 16C16 16 20 12 20 12" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
  },
  {
    key: "face.area.chin",
    svg: <path d="M8 18Q12 22 16 18" strokeWidth="1.5" />,
  },
  {
    key: "face.area.nose",
    svg: (
      <path
        d="M12 8L10 16H14L12 8Z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    key: "face.area.ears",
    svg: (
      <>
        <path d="M6 8C6 8 4 10 4 13C4 16 6 18 6 18" strokeWidth="1.5" />
        <path d="M18 8C18 8 20 10 20 13C20 16 18 18 18 18" strokeWidth="1.5" />
      </>
    ),
  },
];

export function InsightsCard() {
  const t = useT();
  return (
    <section className="ornate-card px-6 py-7">
      <div className="flex items-center mb-5" aria-hidden>
        <span className="flex-1 h-px bg-gold/40" />
        <h2 className="mx-3 font-[family-name:var(--font-cinzel)] text-base tracking-[0.2em] uppercase text-cinnabar">
          {t("face.insights")}
        </h2>
        <span className="flex-1 h-px bg-gold/40" />
      </div>

      <h3 className="text-[11px] tracking-[0.2em] uppercase text-cinnabar pb-2 mb-3 border-b border-gold/30">
        {t("face.destiny_principles")}
      </h3>
      <ul className="space-y-3">
        {principleKeys.map((k, i) => (
          <li key={k} className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full border border-gold bg-parchment-soft text-ink-dark flex items-center justify-center text-xs font-[family-name:var(--font-cinzel)]">
              {i + 1}
            </span>
            <p className="text-sm text-ink-dark leading-relaxed">
              <span className="font-medium text-ink-dark">
                {t(`face.principle.${k}.title`)}
              </span>{" "}
              <span className="text-ink-light">
                {t(`face.principle.${k}.body`)}
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
        {t("face.key_areas")}
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
