"use client";

import { useT } from "@/lib/i18n";

type Trust = { key: "private" | "tradition" | "care"; path: string };

const trust: Trust[] = [
  {
    key: "private",
    path: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    key: "tradition",
    path: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
  },
  {
    key: "care",
    path: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
];

export function AnalysisCta() {
  const t = useT();
  return (
    <section className="mt-4 mb-2 px-1">
      <div className="flex justify-center gap-5">
        {trust.map((tr) => (
          <div key={tr.key} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center text-ink-light shrink-0">
              <svg
                aria-hidden
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  d={tr.path}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-[10px] text-ink-dark leading-tight">
              {t(`face.trust.${tr.key}`)}
              <div>{t(`face.trust.${tr.key}_sub`)}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
