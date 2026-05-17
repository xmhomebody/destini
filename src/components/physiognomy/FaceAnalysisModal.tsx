"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type * as FaceApiNS from "face-api.js";
import { EmailGate } from "@/components/common/EmailGate";
import { hasUserIdentity } from "@/lib/userAuth";
import { useI18n } from "@/lib/i18n";
import {
  buildFeatures,
  resolveLabelCollisions,
  type Feature,
  type Pt,
} from "./faceFeatures";

type Props = {
  imageSrc: string;
  onClose: () => void;
};

type Status = "loading" | "detecting" | "none" | "ready";

export function FaceAnalysisModal({ imageSrc, onClose }: Props) {
  const { t, lang } = useI18n();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [overlayReady, setOverlayReady] = useState(false);
  const [readingsReady, setReadingsReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [imgRect, setImgRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    natW: number;
    natH: number;
  } | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const faceapi = (await import("face-api.js")) as typeof FaceApiNS;
      if (cancelled) return;

      setStatus("loading");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      ]);
      if (cancelled) return;

      const img = imgRef.current;
      if (!img) return;
      if (!img.complete || img.naturalWidth === 0) {
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }
      if (cancelled) return;

      setStatus("detecting");
      // Pick an inputSize close to the image short side but capped at 608
      const shortSide = Math.min(img.naturalWidth, img.naturalHeight);
      const inputSize = shortSide >= 600 ? 608 : shortSide >= 480 ? 512 : shortSide >= 380 ? 416 : 320;
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.5 }))
        .withFaceLandmarks();
      if (cancelled) return;

      if (!detection) {
        setStatus("none");
        return;
      }

      const faceH = detection.detection.box.height;
      const built = buildFeatures(detection);

      // Final pass: nudge labels that are still vertically too close on the same side
      resolveLabelCollisions(built, faceH);

      setFeatures(built);
      setStatus("ready");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  useEffect(() => {
    function recompute() {
      const img = imgRef.current;
      const container = containerRef.current;
      if (!img || !container) return;
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      if (!natW || !natH) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scale = Math.min(cw / natW, ch / natH);
      const width = natW * scale;
      const height = natH * scale;
      setImgRect({
        left: (cw - width) / 2,
        top: (ch - height) / 2,
        width,
        height,
        natW,
        natH,
      });
    }
    recompute();
    const container = containerRef.current;
    const ro = container ? new ResizeObserver(recompute) : null;
    if (container && ro) ro.observe(container);
    window.addEventListener("resize", recompute);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", recompute);
    vv?.addEventListener("scroll", recompute);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", recompute);
      vv?.removeEventListener("resize", recompute);
      vv?.removeEventListener("scroll", recompute);
    };
  }, [imageSrc, imageLoaded, status]);

  useEffect(() => {
    if (status !== "ready" || !imageLoaded) return;
    // 已留邮箱 / 唤回链接已写入 → 直接解锁分析报告；否则等用户操作
    if (hasUserIdentity()) setUnlocked(true);
    const t1 = setTimeout(() => setOverlayReady(true), 250);
    const t2 = setTimeout(() => setReadingsReady(true), 250 + features.length * 90 + 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [status, imageLoaded, features.length]);

  async function openDetailedReport() {
    setReportError(null);
    setReportLoading(true);
    try {
      const res = await fetch("/api/face-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc, lang, withScores: true }),
      });
      const json = (await res.json()) as
        | { ok: true; lang: string; scores: unknown; content: unknown }
        | { error: string };
      if (!res.ok || !("ok" in json)) {
        setReportError("分析生成失败，请稍后重试。");
        return;
      }
      sessionStorage.setItem(
        "destini-face-report",
        JSON.stringify({
          image: imageSrc,
          report: { scores: json.scores, i18n: { [json.lang]: json.content } },
        }),
      );
      window.location.href = "/report/face";
    } catch {
      setReportError("网络错误，请稍后重试。");
    } finally {
      setReportLoading(false);
    }
  }

  function project(p: Pt): Pt {
    if (!imgRect) return p;
    const sx = imgRect.width / imgRect.natW;
    const sy = imgRect.height / imgRect.natH;
    return { x: imgRect.left + p.x * sx, y: imgRect.top + p.y * sy };
  }

  const labelFontSize = imgRect ? Math.max(11, Math.min(16, imgRect.width / 30)) : 13;

  const modal = (
    <div className="fixed inset-0 z-[100] bg-ink-dark/95 backdrop-blur-sm flex flex-col">
      <header className="relative flex items-center justify-between px-4 py-3 border-b border-gold/30 text-parchment">
        <button
          onClick={onClose}
          aria-label="Close analysis"
          className="w-9 h-9 rounded-full border border-gold/40 flex items-center justify-center hover:bg-gold/10 transition"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="font-[family-name:var(--font-cinzel)] text-sm tracking-[0.3em] uppercase text-gold">
          {t("face.modal.title")}
        </h2>
        <span className="w-9 h-9" aria-hidden />
      </header>

      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Portrait under analysis"
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain select-none pointer-events-none transition-opacity duration-[900ms] ease-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {imgRect && imageLoaded && (
          <div
            className="absolute pointer-events-none bg-black/30"
            style={{
              left: imgRect.left,
              top: imgRect.top,
              width: imgRect.width,
              height: imgRect.height,
            }}
          />
        )}

        {imgRect && features.length > 0 && overlayReady && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g aria-hidden="true">
              {features.map((f, idx) => {
                const projected = f.points.map(project);
                const isPoint = projected.length === 1;
                const d = isPoint
                  ? ""
                  : projected
                      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                      .join(" ") + (f.closed ? " Z" : "");
                return (
                  <g
                    key={`marker-${f.key}`}
                    className="destini-feature-marker"
                    style={{ "--feature-delay": `${idx * 90}ms` } as CSSProperties}
                  >
                    {!isPoint && (
                      <path
                        d={d}
                        fill="none"
                        stroke="#c2a878"
                        strokeWidth={1.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.95}
                        filter="url(#glow)"
                      />
                    )}
                    {projected.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={isPoint ? 4 : 2.2}
                        fill={isPoint ? "#c2a878" : "#9a2a1b"}
                        stroke="#f0e8da"
                        strokeWidth={isPoint ? 1 : 0.6}
                      />
                    ))}
                  </g>
                );
              })}
            </g>

            <g>
              {features.map((f, idx) => {
                const label = project(f.labelPos);
                const fontSize = f.small ? labelFontSize * 0.78 : labelFontSize;
                return (
                  <text
                    key={`label-${f.key}`}
                    className="destini-feature-label"
                    x={label.x}
                    y={label.y}
                    textAnchor={f.align}
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontFamily="var(--font-cinzel), serif"
                    fontWeight={600}
                    fontSize={fontSize}
                    letterSpacing="0.12em"
                    style={
                      {
                        "--feature-delay": `${idx * 90}ms`,
                        textTransform: "uppercase",
                      } as CSSProperties
                    }
                  >
                    {t(`face.feature.${f.key}.label`)}
                  </text>
                );
              })}
            </g>
          </svg>
        )}

        {(status === "loading" || status === "detecting" || status === "none") && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-dark/40 pointer-events-none">
            <div className="text-center px-6">
              {status !== "none" && (
                <div className="mx-auto mb-4 w-12 h-12 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              )}
              <p className="font-[family-name:var(--font-cinzel)] text-sm tracking-[0.25em] uppercase text-gold">
                {t(`face.modal.status.${status}`)}
              </p>
            </div>
          </div>
        )}
      </div>

      {status === "ready" && (
        <div
          className={`border-t border-gold/30 bg-ink-dark/60 h-[40vh] overflow-y-auto transition-all duration-700 ease-out ${
            readingsReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {unlocked ? (
            <div className="max-w-md mx-auto px-4 py-4 space-y-3">
              <button
                type="button"
                onClick={openDetailedReport}
                disabled={reportLoading}
                className="w-full py-3 rounded-full font-[family-name:var(--font-cinzel)] text-sm tracking-[0.2em] uppercase text-white transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(180deg, #c23a26 0%, #8a1e10 100%)",
                  boxShadow:
                    "0 4px 0 #5a1008, 0 6px 14px rgba(139,33,33,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {reportLoading ? "正在生成详细报告…" : "查看完整详细报告"}
              </button>
              {reportError && (
                <p className="text-[#ff8a78] text-[11px] text-center tracking-wide">
                  {reportError}
                </p>
              )}
              <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.4em] uppercase text-gold/80 text-left">
                {t("face.modal.canon")}
              </p>
              {features.map((f) => (
                <div
                  key={`r-${f.key}`}
                  className="p-3 rounded-lg border border-gold/20 bg-parchment/5 text-left"
                >
                  <p className="text-gold font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] uppercase mb-1.5">
                    {t(`face.feature.${f.key}.label`)}
                  </p>
                  <p className="text-parchment/90 text-[13px] leading-relaxed font-[family-name:var(--font-playfair)] text-left">
                    {t(`face.feature.${f.key}.reading`)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmailGate onUnlock={() => setUnlocked(true)} />
          )}
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
