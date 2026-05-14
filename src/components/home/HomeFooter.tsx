"use client";

import { useT } from "@/lib/i18n";

type Feature = {
  key: "private" | "tradition" | "care";
  /** 自定义 SVG 路径，沿用 stroke="currentColor" */
  path: string;
};

const features: Feature[] = [
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

const BRIGHT_YELLOW = "#e8c468";

export function HomeFooter() {
  const t = useT();
  return (
    <footer className="mt-1 pb-4 w-full relative z-10" style={{ color: BRIGHT_YELLOW }}>
      <div
        className="flex justify-center gap-6 px-6 mb-8 pb-6 w-[90%] mx-auto"
        style={{ borderBottom: `1px solid ${BRIGHT_YELLOW}` }}
      >
        {features.map((f) => (
          <div key={f.key} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ border: `1px solid ${BRIGHT_YELLOW}`, color: BRIGHT_YELLOW }}
            >
              <svg
                aria-hidden
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d={f.path}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
            </div>
            <div className="text-[10px] leading-tight" style={{ color: BRIGHT_YELLOW }}>
              {t(`home.feature.${f.key}`)}
              <div>{t(`home.feature.${f.key}_sub`)}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="text-center flex justify-center items-center gap-4 text-[9px] tracking-[0.2em] uppercase pb-4"
        style={{ color: BRIGHT_YELLOW }}
      >
        <span>{t("home.tagline1")}</span>
        <span aria-hidden>•</span>
        <span>{t("home.tagline2")}</span>
        <span aria-hidden>•</span>
        <span>{t("home.tagline3")}</span>
      </div>
    </footer>
  );
}
