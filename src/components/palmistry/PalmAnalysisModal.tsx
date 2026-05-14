"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  HandLandmarker as HandLandmarkerType,
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  buildTemplateLines,
  extractPalmLines,
  type ClassifiedLine,
  type LineKey,
} from "./extractPalmLines";
import { EmailGate } from "@/components/common/EmailGate";
import { hasUserIdentity } from "@/lib/userAuth";
import { useT } from "@/lib/i18n";

type Props = {
  imageSrc: string;
  onClose: () => void;
};

type Pt = { x: number; y: number };

type RenderLine = ClassifiedLine & {
  /** Stroke color */
  color: string;
  /** Label anchor point in normalized image coords */
  labelPos: Pt;
  /** Label SVG text-anchor */
  align: "start" | "middle" | "end";
};

type Status = "loading" | "detecting" | "extracting" | "none" | "empty" | "ready";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/** 渲染顺序（同时也是图例顺序）。*/
const LINE_ORDER: LineKey[] = ["heart", "head", "life", "fate", "marriage"];

/**
 * 五条纹路对应的展示元数据：颜色、读解文字。
 * 颜色选用高饱和度，在深色照片蒙版上仍清晰可辨且互不混淆。
 */
const LINE_COLORS: Record<LineKey, string> = {
  heart: "#ff5d73",
  head: "#4fc3f7",
  life: "#9be564",
  fate: "#ffd54f",
  marriage: "#ce93d8",
};

/** 标签宽度估算（用于碰撞分散），按英文标签字符数近似 */
const LABEL_WIDTH_HINT: Record<LineKey, string> = {
  heart: "Heart Line",
  head: "Head Line",
  life: "Life Line",
  fate: "Fate Line",
  marriage: "Marriage Line",
};

const regularizePalmLine = (
  key: LineKey,
  source: Pt[],
  template: Pt[],
  landmarks: NormalizedLandmark[],
): Pt[] => {
  const wrist: Pt = { x: landmarks[0].x, y: landmarks[0].y };
  const middleMcp: Pt = { x: landmarks[9].x, y: landmarks[9].y };
  const pinkyMcp: Pt = { x: landmarks[17].x, y: landmarks[17].y };

  const fwd = sub(middleMcp, wrist);
  const fLen = Math.hypot(fwd.x, fwd.y) || 1;
  const fNorm = { x: fwd.x / fLen, y: fwd.y / fLen };
  const perpRaw = { x: -fNorm.y, y: fNorm.x };
  const perpSign = dot(perpRaw, sub(pinkyMcp, wrist)) >= 0 ? 1 : -1;
  const acrossPinky = { x: perpRaw.x * perpSign, y: perpRaw.y * perpSign };
  const acrossThumb = { x: -acrossPinky.x, y: -acrossPinky.y };

  const base = chooseArcBase(source, template);
  const start = base[0];
  const end = base[base.length - 1];
  let controlOffset: Pt;
  let samples = 14;

  switch (key) {
    case "heart":
      controlOffset = mul(fNorm, -fLen * 0.08);
      break;
    case "head":
      controlOffset = mul(fNorm, fLen * 0.04);
      break;
    case "life":
      controlOffset = mul(acrossThumb, fLen * 0.16);
      break;
    case "fate":
      controlOffset = mul(acrossPinky, fLen * 0.03);
      break;
    case "marriage":
      controlOffset = mul(fNorm, fLen * 0.005);
      samples = 8;
      break;
  }

  return arcSamples(start, end, controlOffset, samples);
};

export function PalmAnalysisModal({ imageSrc, onClose }: Props) {
  const t = useT();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lines, setLines] = useState<RenderLine[]>([]);
  const [overlayReady, setOverlayReady] = useState(false);
  const [readingsReady, setReadingsReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [imgRect, setImgRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
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
    let landmarker: HandLandmarkerType | null = null;

    async function run() {
      try {
        setStatus("loading");

        // 1. Load MediaPipe Tasks Vision
        const vision = await import("@mediapipe/tasks-vision");
        if (cancelled) return;
        const { FilesetResolver, HandLandmarker } = vision;

        const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
        if (cancelled) return;

        // GPU 在 iOS Safari 上常常初始化失败 → 自动降级到 CPU
        try {
          landmarker = await HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
            runningMode: "IMAGE",
            numHands: 1,
          });
        } catch (gpuErr) {
          console.warn("HandLandmarker GPU delegate failed, falling back to CPU", gpuErr);
          landmarker = await HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
            runningMode: "IMAGE",
            numHands: 1,
          });
        }
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

        // 2. Detect hand landmarks
        setStatus("detecting");
        const result: HandLandmarkerResult = landmarker.detect(img);
        if (cancelled) return;

        const lm = result.landmarks?.[0];
        if (!lm || lm.length < 21) {
          setStatus("none");
          return;
        }

        // 3. Build 5 template polylines as a baseline (always shown)
        const templates = buildTemplateLines(lm as NormalizedLandmark[]);

        // 4. Try to extract real creases. Each match overrides its template; misses keep the template.
        let extracted: ClassifiedLine[] = [];
        try {
          setStatus("extracting");
          extracted = await extractPalmLines(img, lm as NormalizedLandmark[]);
        } catch (err) {
          console.warn("Palm extraction failed; using templates only", err);
        }
        if (cancelled) return;

        const extractedByKey = new Map<LineKey, ClassifiedLine>();
        for (const e of extracted) extractedByKey.set(e.key, e);

        const merged: ClassifiedLine[] = LINE_ORDER.map((key) => ({
          key,
          points: regularizePalmLine(
            key,
            extractedByKey.get(key)?.points ?? templates[key],
            templates[key],
            lm as NormalizedLandmark[],
          ),
        }));

        // 5. Attach render metadata + compute label anchors
        const decorated = decorateForRender(merged, lm as NormalizedLandmark[]);
        setLines(decorated);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Palm analysis failed", err);
        setStatus("empty");
      }
    }

    void run();
    return () => {
      cancelled = true;
      try {
        landmarker?.close();
      } catch {
        // noop
      }
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
    const t2 = setTimeout(() => setReadingsReady(true), 250 + lines.length * 150 + 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [status, imageLoaded, lines.length]);

  function project(p: Pt): Pt {
    if (!imgRect) return p;
    return {
      x: imgRect.left + p.x * imgRect.width,
      y: imgRect.top + p.y * imgRect.height,
    };
  }

  const labelFontSize = imgRect ? Math.max(11, Math.min(15, imgRect.width / 32)) : 13;

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
          {t("palm.modal.title")}
        </h2>
        <span className="w-9 h-9" aria-hidden />
      </header>

      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Palm under analysis"
          crossOrigin="anonymous"
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain select-none pointer-events-none transition-opacity duration-[900ms] ease-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {imgRect && imageLoaded && (
          <div
            className="absolute pointer-events-none bg-black/35"
            style={{
              left: imgRect.left,
              top: imgRect.top,
              width: imgRect.width,
              height: imgRect.height,
            }}
          />
        )}

        {imgRect && lines.length > 0 && overlayReady && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="palm-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g aria-hidden="true">
              {lines.map((line, idx) => {
                const pts = line.points.map(project);
                const d = catmullRomPath(pts);
                const start = pts[0];
                const end = pts[pts.length - 1];
                return (
                  <g
                    key={`palm-line-${line.key}`}
                    className="destini-feature-marker"
                    style={{ "--feature-delay": `${idx * 150}ms` } as CSSProperties}
                  >
                    {/* Dark backing stroke for legibility against bright palm areas */}
                    <path
                      d={d}
                      fill="none"
                      stroke="rgba(0,0,0,0.55)"
                      strokeWidth={4.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Colored stroke */}
                    <path
                      d={d}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#palm-glow)"
                    />
                    <circle cx={start.x} cy={start.y} r={3} fill={line.color} stroke="#0f0a07" strokeWidth={0.8} />
                    <circle cx={end.x} cy={end.y} r={3} fill={line.color} stroke="#0f0a07" strokeWidth={0.8} />
                  </g>
                );
              })}
            </g>

            <g>
              {lines.map((line, idx) => {
                const label = project(line.labelPos);
                return (
                  <g
                    key={`palm-label-${line.key}`}
                    className="destini-feature-label"
                    style={
                      {
                        "--feature-delay": `${idx * 150}ms`,
                      } as CSSProperties
                    }
                  >
                    <text
                      x={label.x}
                      y={label.y}
                      textAnchor={line.align}
                      dominantBaseline="middle"
                      fill="#000000"
                      stroke="#000000"
                      strokeWidth={3}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      fontFamily="var(--font-cinzel), serif"
                      fontWeight={700}
                      fontSize={labelFontSize}
                      letterSpacing="0.12em"
                      style={{ textTransform: "uppercase" }}
                    >
                      {t(`palm.line.${line.key}.label`)}
                    </text>
                    <text
                      x={label.x}
                      y={label.y}
                      textAnchor={line.align}
                      dominantBaseline="middle"
                      fill={line.color}
                      fontFamily="var(--font-cinzel), serif"
                      fontWeight={700}
                      fontSize={labelFontSize}
                      letterSpacing="0.12em"
                      style={{ textTransform: "uppercase" }}
                    >
                      {t(`palm.line.${line.key}.label`)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {status !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-dark/40 pointer-events-none">
            <div className="text-center px-6">
              {status !== "none" && status !== "empty" && (
                <div className="mx-auto mb-4 w-12 h-12 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              )}
              <p className="font-[family-name:var(--font-cinzel)] text-sm tracking-[0.25em] uppercase text-gold">
                {t(`palm.modal.status.${status}`)}
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
              <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.4em] uppercase text-gold/80 text-left">
                {t("palm.modal.five_lines")}
              </p>
              {lines.map((line) => (
                <div
                  key={`palm-r-${line.key}`}
                  className="p-3 rounded-lg border border-gold/20 bg-parchment/5 text-left"
                  style={{ borderLeft: `3px solid ${line.color}` }}
                >
                  <p
                    className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] uppercase mb-1.5"
                    style={{ color: line.color }}
                  >
                    {t(`palm.line.${line.key}.label`)}
                  </p>
                  <p className="text-parchment/90 text-[13px] leading-relaxed font-[family-name:var(--font-playfair)] text-left">
                    {t(`palm.line.${line.key}.reading`)}
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

// =============================================================================
// Line regularization: keep extracted/template strokes as single clean arcs
// =============================================================================

function chooseArcBase(source: Pt[], template: Pt[]): Pt[] {
  if (source.length < 2) return template;
  const sourceChord = distance(source[0], source[source.length - 1]);
  const templateChord = distance(template[0], template[template.length - 1]);
  if (templateChord === 0) return source;
  if (sourceChord < templateChord * 0.55 || sourceChord > templateChord * 1.55) {
    return template;
  }
  return source;
}

function arcSamples(p0: Pt, p1: Pt, ctrlOff: Pt, samples: number): Pt[] {
  const ctrl = {
    x: (p0.x + p1.x) / 2 + ctrlOff.x,
    y: (p0.y + p1.y) / 2 + ctrlOff.y,
  };
  const out: Pt[] = new Array(samples);
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const u = 1 - t;
    out[i] = {
      x: u * u * p0.x + 2 * u * t * ctrl.x + t * t * p1.x,
      y: u * u * p0.y + 2 * u * t * ctrl.y + t * t * p1.y,
    };
  }
  return out;
}

// =============================================================================
// Render decoration: attach meta + label anchor positions per line
// =============================================================================

function decorateForRender(
  lines: ClassifiedLine[],
  landmarks: NormalizedLandmark[],
): RenderLine[] {
  // Normalized image coords for relevant landmarks (used only for label placement)
  const wrist: Pt = { x: landmarks[0].x, y: landmarks[0].y };
  const middleMcp: Pt = { x: landmarks[9].x, y: landmarks[9].y };
  const pinkyMcp: Pt = { x: landmarks[17].x, y: landmarks[17].y };

  // forward direction (wrist → middle MCP) and across (toward pinky)
  const fwd = sub(middleMcp, wrist);
  const fLen = Math.hypot(fwd.x, fwd.y) || 1;
  const fNorm = { x: fwd.x / fLen, y: fwd.y / fLen };
  const perpRaw = { x: -fNorm.y, y: fNorm.x };
  const perpSign = dot(perpRaw, sub(pinkyMcp, wrist)) >= 0 ? 1 : -1;
  const acrossPinky = { x: perpRaw.x * perpSign, y: perpRaw.y * perpSign };
  const acrossThumb = { x: -acrossPinky.x, y: -acrossPinky.y };

  // 标签是否落在画面右侧 → text-anchor 选 start，否则选 end
  function alignFor(anchorPt: Pt): "start" | "middle" | "end" {
    if (anchorPt.x < 0.18) return "start";
    if (anchorPt.x > 0.82) return "end";
    return "middle";
  }

  const decorated = lines.map((line) => {
    const start = line.points[0];
    const end = line.points[line.points.length - 1];
    const mid = line.points[Math.floor(line.points.length / 2)];

    let labelPos: Pt;
    switch (line.key) {
      case "heart": {
        const tip = pickTowardIndex(start, end, wrist, acrossThumb);
        labelPos = clampNorm(shift(tip, [acrossThumb, 0.07], [fNorm, 0.05]));
        break;
      }
      case "head": {
        const tip = pickTowardPinky(start, end, wrist, acrossPinky);
        labelPos = clampNorm(shift(tip, [acrossPinky, 0.09], [fNorm, -0.04]));
        break;
      }
      case "life": {
        labelPos = clampNorm(shift(mid, [acrossThumb, 0.13], [fNorm, -0.03]));
        break;
      }
      case "fate": {
        const tip = pickTowardFingers(start, end, wrist, fNorm);
        labelPos = clampNorm(shift(tip, [acrossPinky, 0.04], [fNorm, 0.07]));
        break;
      }
      case "marriage": {
        const tip = pickTowardPinky(start, end, wrist, acrossPinky);
        labelPos = clampNorm(shift(tip, [acrossPinky, 0.075], [fNorm, 0.065]));
        break;
      }
      default:
        labelPos = mid;
    }

    return {
      ...line,
      color: LINE_COLORS[line.key],
      labelPos,
      align: "middle" as const,
    };
  });

  return separateLabels(decorated).map((line) => ({
    ...line,
    align: alignFor(line.labelPos),
  }));
}

function pickTowardPinky(a: Pt, b: Pt, origin: Pt, acrossPinky: Pt): Pt {
  const aProj = (a.x - origin.x) * acrossPinky.x + (a.y - origin.y) * acrossPinky.y;
  const bProj = (b.x - origin.x) * acrossPinky.x + (b.y - origin.y) * acrossPinky.y;
  return aProj > bProj ? a : b;
}
function pickTowardIndex(a: Pt, b: Pt, origin: Pt, acrossThumb: Pt): Pt {
  return pickTowardPinky(a, b, origin, acrossThumb);
}
function pickTowardFingers(a: Pt, b: Pt, origin: Pt, fwd: Pt): Pt {
  const aProj = (a.x - origin.x) * fwd.x + (a.y - origin.y) * fwd.y;
  const bProj = (b.x - origin.x) * fwd.x + (b.y - origin.y) * fwd.y;
  return aProj > bProj ? a : b;
}

function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y };
}
function mul(a: Pt, s: number): Pt {
  return { x: a.x * s, y: a.y * s };
}
function dot(a: Pt, b: Pt): number {
  return a.x * b.x + a.y * b.y;
}
function distance(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function shift(p: Pt, ...offsets: [Pt, number][]): Pt {
  let x = p.x;
  let y = p.y;
  for (const [v, amount] of offsets) {
    x += v.x * amount;
    y += v.y * amount;
  }
  return { x, y };
}
function clampNorm(p: Pt): Pt {
  return {
    x: Math.max(0.04, Math.min(0.96, p.x)),
    y: Math.max(0.04, Math.min(0.96, p.y)),
  };
}

function separateLabels(lines: RenderLine[]): RenderLine[] {
  const adjusted = lines.map((line) => ({
    ...line,
    labelPos: { ...line.labelPos },
  }));

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < adjusted.length; i++) {
      for (let j = i + 1; j < adjusted.length; j++) {
        const a = adjusted[i];
        const b = adjusted[j];
        const minX = labelHalfWidth(LABEL_WIDTH_HINT[a.key]) + labelHalfWidth(LABEL_WIDTH_HINT[b.key]);
        const minY = 0.055;
        const dx = Math.abs(a.labelPos.x - b.labelPos.x);
        const dy = Math.abs(a.labelPos.y - b.labelPos.y);
        if (dx >= minX || dy >= minY) continue;

        const push = (minY - dy) / 2 + 0.006;
        const aAbove = a.labelPos.y <= b.labelPos.y;
        a.labelPos = clampNorm({
          x: a.labelPos.x,
          y: a.labelPos.y + (aAbove ? -push : push),
        });
        b.labelPos = clampNorm({
          x: b.labelPos.x,
          y: b.labelPos.y + (aAbove ? push : -push),
        });
      }
    }
  }

  return adjusted;
}

function labelHalfWidth(label: string): number {
  return Math.min(0.16, Math.max(0.075, label.length * 0.0065));
}

/** Catmull-Rom → Bézier interpolation for smooth curves through anchor points. */
function catmullRomPath(points: Pt[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} L${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;
  }
  const tension = 1;
  const out: string[] = [`M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / (6 * tension);
    const c1y = p1.y + (p2.y - p0.y) / (6 * tension);
    const c2x = p2.x - (p3.x - p1.x) / (6 * tension);
    const c2y = p2.y - (p3.y - p1.y) / (6 * tension);
    out.push(
      `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`,
    );
  }
  return out.join(" ");
}
