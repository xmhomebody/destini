"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type * as FaceApiNS from "face-api.js";
import { EmailGate } from "@/components/common/EmailGate";
import { hasUserIdentity } from "@/lib/userAuth";
import { useT } from "@/lib/i18n";

type Props = {
  imageSrc: string;
  onClose: () => void;
};

type Pt = { x: number; y: number };
type LabelAlign = "start" | "middle" | "end";

type Feature = {
  key: string;
  en: string;
  reading: string;
  /** outline points in image coordinates (single point = marker dot only) */
  points: Pt[];
  /** label position in image coordinates */
  labelPos: Pt;
  /** svg text-anchor */
  align: LabelAlign;
  /** make this label slightly smaller (for tight areas like philtrum) */
  small?: boolean;
  /** close the polyline into a polygon */
  closed?: boolean;
};

type Status = "loading" | "detecting" | "none" | "ready";

export function FaceAnalysisModal({ imageSrc, onClose }: Props) {
  const t = useT();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [overlayReady, setOverlayReady] = useState(false);
  const [readingsReady, setReadingsReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
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

// =============================================================================
// Feature derivation
// =============================================================================

function buildFeatures(
  detection: FaceApiNS.WithFaceLandmarks<{ detection: FaceApiNS.FaceDetection }, FaceApiNS.FaceLandmarks68>,
): Feature[] {
  const lm = detection.landmarks;
  const pos = lm.positions;
  const jaw = lm.getJawOutline();
  const rightBrow = lm.getRightEyeBrow(); // subject's right, image-left
  const leftBrow = lm.getLeftEyeBrow(); // subject's left, image-right
  const outerLips = lm.getMouth().slice(0, 12);

  // Outer brow ends (subject's right = image-left side)
  const browOuterR = rightBrow[0]; // landmark 17
  const browInnerR = rightBrow[rightBrow.length - 1]; // landmark 21
  const browInnerL = leftBrow[0]; // landmark 22
  const browOuterL = leftBrow[leftBrow.length - 1]; // landmark 26
  const browTopY = Math.min(...rightBrow.concat(leftBrow).map((p) => p.y));

  // Eye outer corners
  const eyeOuterR = pos[36];
  const eyeOuterL = pos[45];

  // Nose
  const noseBridgeTop = pos[27]; // top of nose bridge (between eyes)
  const noseBridgeMid = pos[28];
  const noseTipCenter = pos[30]; // tip of nose
  const noseBase = pos[33]; // center bottom of nose
  const nostrilR = pos[31]; // subject's right nostril side
  const nostrilL = pos[35]; // subject's left nostril side

  // Lips
  const lipTopCenter = outerLips[3]; // landmark 51 — cupid's bow valley center
  const lipBottomCenter = outerLips[9]; // landmark 57 — bottom-lip center
  const mouthCornerR = outerLips[0]; // landmark 48
  const mouthCornerL = outerLips[6]; // landmark 54

  const faceW = detection.detection.box.width;
  const faceH = detection.detection.box.height;
  const G = faceH * 0.04;

  // === 印堂 (Brow Seal) ===
  const yintang: Pt = {
    x: (browInnerR.x + browInnerL.x) / 2,
    y: (browInnerR.y + browInnerL.y) / 2,
  };
  const sealHalf = faceW * 0.04;
  const browSealLine: Pt[] = [
    { x: yintang.x - sealHalf, y: yintang.y },
    { x: yintang.x + sealHalf, y: yintang.y },
  ];

  // === 天庭 (Forehead) — facial-thirds proportion ===
  const noseTipY = noseTipCenter.y;
  const chinY = jaw[8].y;
  const lowerFaceH = chinY - noseTipY;
  const foreheadHeight = lowerFaceH; // rough thirds-rule
  const foreheadTopY = browTopY - foreheadHeight * 0.55;
  const foreheadMidX = (browOuterR.x + browOuterL.x) / 2;
  const foreheadHalfW = (browOuterL.x - browOuterR.x) * 0.45;
  const foreheadArc: Pt[] = [
    { x: foreheadMidX - foreheadHalfW, y: browTopY - foreheadHeight * 0.2 },
    { x: foreheadMidX - foreheadHalfW * 0.5, y: foreheadTopY + foreheadHeight * 0.08 },
    { x: foreheadMidX, y: foreheadTopY },
    { x: foreheadMidX + foreheadHalfW * 0.5, y: foreheadTopY + foreheadHeight * 0.08 },
    { x: foreheadMidX + foreheadHalfW, y: browTopY - foreheadHeight * 0.2 },
  ];
  const foreheadCenter = foreheadArc[2];

  // === 山根 (Mountain Root) — top of nose bridge ===
  const mountainRoot: Pt[] = [noseBridgeTop, noseBridgeMid];

  // === 颧骨 (Cheekbones) — arc from eye outer corner → estimated peak → cheek-side jaw ===
  function cheekArc(eyeOuter: Pt, jawAtCheek: Pt, jawBelow: Pt): { arc: Pt[]; peak: Pt } {
    // Peak: laterally between eye corner and jaw, vertically around nose tip height
    const peak: Pt = {
      x: eyeOuter.x + (jawAtCheek.x - eyeOuter.x) * 0.55,
      y: (eyeOuter.y + noseTipCenter.y) / 2,
    };
    const arc: Pt[] = [
      { x: eyeOuter.x + (jawAtCheek.x - eyeOuter.x) * 0.15, y: eyeOuter.y + (peak.y - eyeOuter.y) * 0.45 },
      peak,
      { x: peak.x + (jawBelow.x - peak.x) * 0.45, y: peak.y + (jawBelow.y - peak.y) * 0.6 },
    ];
    return { arc, peak };
  }
  // subject's right cheek = image-left side: eyeOuterR + jaw[2..4]
  const cheekR = cheekArc(eyeOuterR, jaw[2], jaw[4]);
  // subject's left cheek = image-right side: eyeOuterL + jaw[14..12]
  const cheekL = cheekArc(eyeOuterL, jaw[14], jaw[12]);

  // === 人中 (Philtrum) — nose base center to upper lip top center ===
  const philtrum: Pt[] = [noseBase, lipTopCenter];
  const philtrumMid: Pt = {
    x: (noseBase.x + lipTopCenter.x) / 2,
    y: (noseBase.y + lipTopCenter.y) / 2,
  };

  // === 法令纹 (Authority Line) — curve from nostril side to mouth corner ===
  function authorityArc(nostril: Pt, mouthCorner: Pt, faceCenterX: number): Pt[] {
    const mid: Pt = {
      x: (nostril.x + mouthCorner.x) / 2,
      y: (nostril.y + mouthCorner.y) / 2,
    };
    // Bow outward away from face center
    const outwardDir = mid.x < faceCenterX ? -1 : 1;
    const bow: Pt = {
      x: mid.x + outwardDir * faceW * 0.025,
      y: mid.y + faceH * 0.005,
    };
    return [nostril, bow, mouthCorner];
  }
  const faceCenterX = (jaw[0].x + jaw[16].x) / 2;
  const nasolabialR = authorityArc(nostrilR, mouthCornerR, faceCenterX);
  const nasolabialL = authorityArc(nostrilL, mouthCornerL, faceCenterX);

  // === 嘴唇 (Lips) — outer lip outline (already 12 points, closed) ===

  // === 地阁 (Earth Chamber) — chin arc ===
  const chin: Pt[] = jaw.slice(6, 11);
  const chinBottom = jaw[8];

  // ===========================================================================
  // Label placement — three-column layout (image-left / center / image-right)
  // ===========================================================================
  const features: Feature[] = [
    {
      key: "forehead",
      en: "Forehead",
      reading:
        "A broad, luminous forehead — early fortune shines, learning comes with ease.",
      points: foreheadArc,
      labelPos: { x: foreheadCenter.x, y: foreheadCenter.y + G * 0.4 },
      align: "middle",
    },
    {
      key: "brow-seal",
      en: "Brow Seal",
      reading:
        "The seal between the brows is clear — career path unobstructed, ambition aligned.",
      points: browSealLine,
      labelPos: { x: yintang.x, y: yintang.y - G * 1.1 },
      align: "middle",
    },
    {
      key: "mountain-root",
      en: "Mountain Root",
      reading:
        "Steady mountain root — strong family foundation and resilient middle years.",
      points: mountainRoot,
      labelPos: { x: noseBridgeMid.x + G * 1.3, y: noseBridgeMid.y + G * 0.4 },
      align: "start",
    },
    {
      key: "cheek-right",
      en: "Cheekbone",
      reading: "Rising cheekbone — influence and respect in your prime years.",
      points: cheekR.arc,
      labelPos: { x: cheekR.peak.x - G * 0.5, y: cheekR.peak.y - G * 0.4 },
      align: "end",
    },
    {
      key: "cheek-left",
      en: "Cheekbone",
      reading: "Balanced cheek line — harmony in social and professional circles.",
      points: cheekL.arc,
      labelPos: { x: cheekL.peak.x + G * 0.5, y: cheekL.peak.y - G * 0.4 },
      align: "start",
    },
    {
      key: "philtrum",
      en: "Philtrum",
      reading:
        "Deep and clear philtrum — vitality, longevity, and continuity of lineage.",
      points: philtrum,
      labelPos: { x: philtrumMid.x + G * 1.2, y: philtrumMid.y },
      align: "start",
      small: true,
    },
    {
      key: "nasolabial-r",
      en: "Authority Line",
      reading:
        "Defined authority line — natural command and a voice that carries weight.",
      points: nasolabialR,
      labelPos: {
        x: nasolabialR[1].x - G * 0.6,
        y: nasolabialR[1].y + G * 0.2,
      },
      align: "end",
    },
    {
      key: "nasolabial-l",
      en: "Authority Line",
      reading:
        "Symmetrical authority line — your words shape outcomes around you.",
      points: nasolabialL,
      labelPos: {
        x: nasolabialL[1].x + G * 0.6,
        y: nasolabialL[1].y + G * 0.2,
      },
      align: "start",
    },
    {
      key: "lips",
      en: "Lips",
      reading: "Well-formed lips — eloquence, warmth, and abundance in relationships.",
      points: outerLips,
      closed: true,
      labelPos: { x: lipBottomCenter.x, y: lipBottomCenter.y + G * 1.2 },
      align: "middle",
    },
    {
      key: "earth-chamber",
      en: "Earth Chamber",
      reading: "Rounded earth chamber — prosperity and stability in later years.",
      points: chin,
      labelPos: { x: chinBottom.x, y: chinBottom.y + G * 1.2 },
      align: "middle",
    },
  ];

  return features;
}

// =============================================================================
// Label collision resolution
// Group labels by horizontal column (image-left / center / image-right),
// sort each column by y, and push down any label whose top edge overlaps
// the previous label's bottom.
// =============================================================================

function resolveLabelCollisions(features: Feature[], faceH: number) {
  const minSpacing = faceH * 0.055;

  // Group by column based on text-anchor
  const groups: Record<"left" | "center" | "right", Feature[]> = {
    left: [],
    center: [],
    right: [],
  };
  for (const f of features) {
    if (f.align === "end") groups.left.push(f);
    else if (f.align === "start") groups.right.push(f);
    else groups.center.push(f);
  }
  for (const key of ["left", "center", "right"] as const) {
    groups[key].sort((a, b) => a.labelPos.y - b.labelPos.y);
    for (let i = 1; i < groups[key].length; i++) {
      const prev = groups[key][i - 1];
      const cur = groups[key][i];
      const minY = prev.labelPos.y + minSpacing;
      if (cur.labelPos.y < minY) cur.labelPos.y = minY;
    }
  }
}
