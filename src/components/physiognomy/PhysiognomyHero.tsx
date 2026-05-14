"use client";

import { useT } from "@/lib/i18n";

export function PhysiognomyHero() {
  const t = useT();
  return (
    <header className="text-center mt-6 mb-6 px-4">
      <h1 className="font-[family-name:var(--font-cinzel)] text-2xl sm:text-3xl tracking-[0.16em] uppercase text-cinnabar leading-[1.15] glow-static whitespace-nowrap">
        {t("face.title")}
      </h1>

      <div className="flex justify-center items-center mt-4 opacity-70" aria-hidden>
        <span className="block h-px w-12 bg-gold" />
        <svg
          className="mx-2"
          fill="none"
          height="10"
          viewBox="0 0 12 10"
          width="12"
        >
          <path
            d="M6 1L9 5L6 9L3 5L6 1Z"
            stroke="var(--color-gold)"
            strokeWidth="1"
          />
        </svg>
        <span className="block h-px w-12 bg-gold" />
      </div>
    </header>
  );
}
