"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import type * as FaceApiNS from "face-api.js";
import { useI18n } from "@/lib/i18n";
import {
  buildFeatures,
  resolveLabelCollisions,
  type Feature,
  type Pt,
} from "./faceFeatures";

type Props = { imageSrc: string };

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  natW: number;
  natH: number;
};

/** 三停水平分割线（图像坐标系下的 y 值与左右端点 x） */
type StopLine = { y: number; x0: number; x1: number };

const STOP_KEYS = [
  "report.stop.upper",
  "report.stop.middle",
  "report.stop.lower",
] as const;

export function ReportFaceChart({ imageSrc }: Props) {
  const { t } = useI18n();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [stops, setStops] = useState<StopLine[]>([]);
  const [stopLabels, setStopLabels] = useState<{ y: number }[]>([]);
  const [rect, setRect] = useState<Rect | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const faceapi = (await import("face-api.js")) as typeof FaceApiNS;
      if (cancelled) return;
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

      const shortSide = Math.min(img.naturalWidth, img.naturalHeight);
      const inputSize =
        shortSide >= 600 ? 608 : shortSide >= 480 ? 512 : shortSide >= 380 ? 416 : 320;
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.5 }))
        .withFaceLandmarks();
      if (cancelled || !detection) return;

      const built = buildFeatures(detection);
      resolveLabelCollisions(built, detection.detection.box.height);
      setFeatures(built);

      // 三停：发际线（估算）→ 眉 → 鼻尖 → 下巴
      const lm = detection.landmarks;
      const pos = lm.positions;
      const jaw = lm.getJawOutline();
      const browTopY = Math.min(
        ...lm.getRightEyeBrow().concat(lm.getLeftEyeBrow()).map((p) => p.y),
      );
      const noseTipY = pos[33].y; // 鼻基部
      const chinY = jaw[8].y;
      const hairlineY = browTopY - (chinY - noseTipY); // 三停等分估算
      const x0 = jaw[0].x;
      const x1 = jaw[16].x;
      setStops([
        { y: hairlineY, x0, x1 },
        { y: browTopY, x0, x1 },
        { y: noseTipY, x0, x1 },
        { y: chinY, x0, x1 },
      ]);
      setStopLabels([
        { y: (hairlineY + browTopY) / 2 },
        { y: (browTopY + noseTipY) / 2 },
        { y: (noseTipY + chinY) / 2 },
      ]);
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
      const scale = cw / natW;
      const width = cw;
      const height = natH * scale;
      const ch = height;
      setRect({
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
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [imageSrc, imageLoaded]);

  function project(p: Pt): Pt {
    if (!rect) return p;
    const sx = rect.width / rect.natW;
    const sy = rect.height / rect.natH;
    return { x: rect.left + p.x * sx, y: rect.top + p.y * sy };
  }

  const labelFontSize = rect ? Math.max(11, Math.min(17, rect.width / 26)) : 13;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden border border-gold/40"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt="面相分析底图"
        onLoad={() => setImageLoaded(true)}
        className={`w-full h-auto block select-none pointer-events-none transition-opacity duration-700 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 固定黑色蒙版：与简单面相页一致，提升标注对比度 */}
      {imageLoaded && (
        <div className="absolute inset-0 pointer-events-none bg-black/30" />
      )}

      {rect && (features.length > 0 || stops.length > 0) && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="report-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.1" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── 第一层：线条与标记点 ── */}
          {/* 三停分割线 */}
          {stops.map((s, i) => {
            const a = project({ x: s.x0, y: s.y });
            const b = project({ x: s.x1, y: s.y });
            return (
              <line
                key={`stop-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#9a2a1b"
                strokeWidth={1}
                strokeDasharray="5 4"
                opacity={0.55}
              />
            );
          })}
          {/* 部位轮廓与标记点 */}
          {features.map((f, idx) => {
            const pts = f.points.map(project);
            const isPoint = pts.length === 1;
            const d = isPoint
              ? ""
              : pts
                  .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                  .join(" ") + (f.closed ? " Z" : "");
            return (
              <g
                key={`path-${f.key}`}
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
                    filter="url(#report-glow)"
                  />
                )}
                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={isPoint ? 3.4 : 2}
                    fill={isPoint ? "#c2a878" : "#9a2a1b"}
                    stroke="#f0e8da"
                    strokeWidth={0.7}
                  />
                ))}
              </g>
            );
          })}

          {/* ── 第二层：所有文字（始终在线条之上，白色描边） ── */}
          {stopLabels.map((s, i) => {
            const p = project({ x: stops[0]?.x0 ?? 0, y: s.y });
            return (
              <text
                key={`stoplbl-${i}`}
                className="destini-feature-label"
                x={p.x + 6}
                y={p.y}
                textAnchor="start"
                dominantBaseline="middle"
                fill="#f0d8b0"
                fontFamily="var(--font-cinzel), serif"
                fontSize={labelFontSize * 0.9}
                fontWeight={600}
                letterSpacing="0.1em"
                style={
                  {
                    "--feature-delay": `${i * 90}ms`,
                    textTransform: "uppercase",
                  } as CSSProperties
                }
              >
                {t(STOP_KEYS[i])}
              </text>
            );
          })}
          {features.map((f, idx) => {
            const lbl = project(f.labelPos);
            return (
              <text
                key={`lbl-${f.key}`}
                className="destini-feature-label"
                x={lbl.x}
                y={lbl.y}
                textAnchor={f.align}
                dominantBaseline="middle"
                fill="#ffffff"
                fontFamily="var(--font-cinzel), serif"
                fontSize={f.small ? labelFontSize * 0.82 : labelFontSize}
                fontWeight={600}
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
        </svg>
      )}
    </div>
  );
}
