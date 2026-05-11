"use client";

import { useState } from "react";

type Requirement = { label: string; path: string };

const requirements: Requirement[] = [
  {
    label: "Good Lighting",
    path: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  },
  {
    label: "No Filters",
    path: "M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm5.25 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z",
  },
  {
    label: "Face Centered",
    path: "M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    label: "No Obstruction",
    path: "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88",
  },
];

const INPUT_ID = "photo-upload";

export function UploadCard() {
  const [preview, setPreview] = useState<string | null>(null);

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
          <img
            src={preview}
            alt="Uploaded portrait"
            className="w-full h-full object-cover rounded-3xl"
          />
        ) : (
          <svg
            aria-hidden
            className="w-40 h-40 text-gold/60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            viewBox="0 0 100 100"
          >
            <path d="M50 15 C30 15 20 35 20 50 C20 70 35 85 50 90 C65 85 80 70 80 50 C80 35 70 15 50 15 Z" />
            <path d="M35 45 C40 43 45 43 50 45 M65 45 C60 43 55 43 50 45" />
            <circle cx="38" cy="50" r="2" fill="currentColor" />
            <circle cx="62" cy="50" r="2" fill="currentColor" />
            <path d="M50 55 L50 65 L48 67" />
            <path d="M40 75 Q50 80 60 75" />
          </svg>
        )}
      </label>

      <h2 className="font-[family-name:var(--font-cinzel)] text-xl tracking-[0.2em] uppercase text-cinnabar">
        {preview ? "Photo Selected" : "Tap to Upload"}
      </h2>
      <p className="mt-1 text-[11px] tracking-[0.2em] uppercase text-ink-light">
        {preview ? "Tap photo to change" : "A clear front-facing photo"}
      </p>

      {preview ? (
        <button
          type="button"
          className="mt-6 w-full py-4 rounded-full font-[family-name:var(--font-cinzel)] text-base tracking-[0.2em] uppercase text-white transition-all duration-200 active:scale-[0.97]"
          style={{
            background: "linear-gradient(180deg, #c23a26 0%, #8a1e10 100%)",
            boxShadow:
              "0 6px 0 #5a1008, 0 8px 16px rgba(139,33,33,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
            textShadow: "0 1px 2px rgba(0,0,0,0.35)",
          }}
        >
          Begin Your Reading
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
          Upload Photo
        </label>
      )}

      <div className="mt-6 pt-5 border-t border-gold/30 grid grid-cols-4 gap-2">
        {requirements.map((r) => (
          <div key={r.label} className="flex flex-col items-center">
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
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
