"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export function PhysiognomyTopNav() {
  const t = useT();
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 w-full bg-[rgba(240,232,218,0.88)] backdrop-blur-sm border-b border-gold/30"
    >
      <div className="relative flex items-center px-4 py-3 w-full">
        <Link
          href="/"
          aria-label="Back to home"
          className="p-1.5 -ml-1.5 text-ink-light hover:text-cinnabar transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              d="M15.75 19.5L8.25 12l7.5-7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <span className="font-[family-name:var(--font-cinzel)] text-xl tracking-[0.25em] text-cinnabar uppercase">
            Destini
          </span>
          <span className="mt-0.5 text-[9px] tracking-[0.25em] text-ink-light uppercase whitespace-nowrap">
            {t("nav.insight")} · {t("nav.physiognomy")}
          </span>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
