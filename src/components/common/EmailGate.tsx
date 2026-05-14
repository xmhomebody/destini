"use client";

import { useState } from "react";
import { isValidEmail, setStoredEmail } from "@/lib/userAuth";
import { useT } from "@/lib/i18n";

type Props = {
  /** Called immediately after the user submits a valid email */
  onUnlock: () => void;
};

export function EmailGate({ onUnlock }: Props) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError(t("email.invalid"));
      return;
    }
    setStoredEmail(trimmed);
    setError(null);
    onUnlock();
  }

  return (
    <div className="max-w-md mx-auto px-5 py-6 text-center">
      <p className="font-[family-name:var(--font-cinzel)] text-sm tracking-[0.3em] uppercase text-gold">
        {t("email.complete")}
      </p>
      <p className="mt-2 text-parchment/85 text-[13px] leading-relaxed font-[family-name:var(--font-playfair)]">
        {t("email.instruction")}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("email.placeholder")}
          autoComplete="email"
          inputMode="email"
          className="w-full px-4 py-3 rounded-lg border border-gold/40 bg-parchment/10 text-parchment placeholder:text-parchment/35 focus:outline-none focus:border-gold transition-colors text-[16px] font-[family-name:var(--font-playfair)] text-center"
        />
        {error && (
          <p className="text-[#ff8a78] text-[11px] tracking-wide font-[family-name:var(--font-playfair)]">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full py-3 rounded-full font-[family-name:var(--font-cinzel)] text-sm tracking-[0.25em] uppercase text-white transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(180deg, #c23a26 0%, #8a1e10 100%)",
            boxShadow:
              "0 4px 0 #5a1008, 0 6px 14px rgba(139,33,33,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {t("email.submit")}
        </button>
      </form>
    </div>
  );
}
