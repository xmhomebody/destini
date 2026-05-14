"use client";

import { useState } from "react";
import Image from "next/image";
import { PalmAnalysisModal } from "./PalmAnalysisModal";
import { useT } from "@/lib/i18n";

type Requirement = { key: string; path: string };

const requirements: Requirement[] = [
  {
    key: "palm.req.open",
    path: "M7.5 11.25v-3.75a1.5 1.5 0 113 0v3.75m0 0V4.5a1.5 1.5 0 113 0v6.75m0 0V6a1.5 1.5 0 113 0v6m0 0v3a6 6 0 11-12 0v-3a1.5 1.5 0 113 0",
  },
  {
    key: "palm.req.lighting",
    path: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  },
  {
    key: "palm.req.centered",
    path: "M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    key: "palm.req.sharp",
    path: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z",
  },
];

const INPUT_ID = "palm-photo-upload";

export function PalmUploadCard() {
  const t = useT();
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="ornate-card relative px-6 py-8 text-center">
      <span aria-hidden className="absolute top-2 left-2 w-4 h-4 border-t border-l border-cinnabar/40" />
      <span aria-hidden className="absolute top-2 right-2 w-4 h-4 border-t border-r border-cinnabar/40" />
      <span aria-hidden className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-cinnabar/40" />
      <span aria-hidden className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-cinnabar/40" />

      <input
        id={INPUT_ID}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      <label
        htmlFor={INPUT_ID}
        className="w-56 h-56 mx-auto mb-6 rounded-3xl border-2 border-dashed border-gold/70 bg-parchment-soft/60 flex items-center justify-center relative overflow-hidden cursor-pointer"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Uploaded palm"
            className="w-full h-full object-cover rounded-3xl"
          />
        ) : (
          <Image
            src="/images/img_palmr_upload.png"
            alt=""
            fill
            className="object-cover opacity-50"
          />
        )}
      </label>

      <h2 className="font-[family-name:var(--font-cinzel)] text-xl tracking-[0.2em] uppercase text-cinnabar">
        {preview ? t("common.photo_selected") : t("common.tap_to_upload")}
      </h2>
      <p className="mt-1 text-[11px] tracking-[0.2em] uppercase text-ink-light">
        {preview ? t("common.tap_to_change") : t("palm.upload.subtitle")}
      </p>

      {preview ? (
        <button
          type="button"
          onClick={() => setAnalyzing(true)}
          className="mt-6 w-full py-4 rounded-full font-[family-name:var(--font-cinzel)] text-base tracking-[0.2em] uppercase text-white transition-all duration-200 active:scale-[0.97]"
          style={{
            background: "linear-gradient(180deg, #c23a26 0%, #8a1e10 100%)",
            boxShadow:
              "0 6px 0 #5a1008, 0 8px 16px rgba(139,33,33,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
            textShadow: "0 1px 2px rgba(0,0,0,0.35)",
          }}
        >
          {t("common.begin_reading")}
        </button>
      ) : (
        <label
          htmlFor={INPUT_ID}
          className="btn-cinnabar mt-6 w-full py-3.5 rounded-full flex items-center justify-center gap-2 font-[family-name:var(--font-cinzel)] text-sm tracking-[0.2em] uppercase cursor-pointer"
        >
          <svg
            aria-hidden
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("common.upload_photo")}
        </label>
      )}

      {analyzing && preview && (
        <PalmAnalysisModal imageSrc={preview} onClose={() => setAnalyzing(false)} />
      )}

      <div className="mt-6 pt-5 border-t border-gold/30 grid grid-cols-4 gap-2">
        {requirements.map((r) => (
          <div key={r.key} className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full border border-gold flex items-center justify-center text-ink-light mb-1.5">
              <svg
                aria-hidden
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d={r.path} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[9px] tracking-[0.1em] uppercase text-ink-light leading-tight text-center">
              {t(r.key)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
