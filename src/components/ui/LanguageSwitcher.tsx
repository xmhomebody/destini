"use client";

import { useEffect, useRef, useState } from "react";
import { LANGS, useI18n } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function select(code: typeof LANGS[number]["code"]) {
    setLang(code);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch language"
        aria-expanded={open}
        className="flex items-center gap-1.5 pl-[7px] pr-[8px] py-1 rounded-full bg-parchment/85 backdrop-blur-sm border border-gold/85 text-ink-light hover:text-cinnabar hover:bg-parchment/95 transition-colors shadow-sm"
      >
        {/* Globe icon */}
        <svg
          className="w-[26px] h-[26px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
        <span className="inline-block w-[26px] text-center text-[13px] tracking-[0.12em] uppercase font-[family-name:var(--font-cinzel)]">
          {lang}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 min-w-[152px] rounded-xl border border-gold/40 bg-[rgba(245,239,229,0.97)] backdrop-blur-sm shadow-lg z-50 overflow-hidden py-1">
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => select(l.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-cinnabar/8 text-cinnabar"
                    : "text-ink-dark hover:bg-gold/20"
                }`}
              >
                <span className="text-[16px] font-[family-name:var(--font-playfair)]">
                  {l.native}
                </span>
                {active && (
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
