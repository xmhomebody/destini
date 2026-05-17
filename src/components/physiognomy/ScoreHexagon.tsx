"use client";

import type { FaceScores } from "@/lib/faceReport";
import { useT } from "@/lib/i18n";

type Props = { scores: FaceScores };

const DIMS: { key: keyof FaceScores; i18n: string }[] = [
  { key: "wisdom", i18n: "report.score.wisdom" },
  { key: "drive", i18n: "report.score.drive" },
  { key: "wealth", i18n: "report.score.wealth" },
  { key: "fortune", i18n: "report.score.fortune" },
  { key: "charisma", i18n: "report.score.charisma" },
  { key: "emotion", i18n: "report.score.emotion" },
];

const SIZE = 260;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 88;
// 标签向外延伸，留出边距避免文字被裁切
const PAD_X = 64;
const PAD_Y = 22;

function pointAt(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
}

export function ScoreHexagon({ scores }: Props) {
  const t = useT();

  // 顶点从正上方开始，顺时针每 60°
  const axes = DIMS.map((d, i) => {
    const angle = -90 + i * 60;
    const value = Math.max(0, Math.min(100, scores[d.key] ?? 0));
    return { ...d, angle, value };
  });

  const ringPoly = (frac: number) =>
    axes
      .map((ax) => {
        const p = pointAt(ax.angle, R * frac);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

  const dataPoly = axes
    .map((ax) => {
      const p = pointAt(ax.angle, R * (ax.value / 100));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`${-PAD_X} ${-PAD_Y} ${SIZE + PAD_X * 2} ${SIZE + PAD_Y * 2}`}
      className="w-full max-w-[340px] mx-auto"
      role="img"
      aria-label="Six-dimension score chart"
    >
      {/* 网格环 */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={ringPoly(f)}
          fill="none"
          stroke="#c2a878"
          strokeOpacity={f === 1 ? 0.6 : 0.3}
          strokeWidth={1}
        />
      ))}

      {/* 轴线 */}
      {axes.map((ax) => {
        const p = pointAt(ax.angle, R);
        return (
          <line
            key={ax.key}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke="#c2a878"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        );
      })}

      {/* 数据多边形 */}
      <polygon
        points={dataPoly}
        fill="#9a2a1b"
        fillOpacity={0.22}
        stroke="#9a2a1b"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {axes.map((ax) => {
        const p = pointAt(ax.angle, R * (ax.value / 100));
        return (
          <circle key={ax.key} cx={p.x} cy={p.y} r={3} fill="#9a2a1b" />
        );
      })}

      {/* 维度标签 + 分值 */}
      {axes.map((ax) => {
        const lp = pointAt(ax.angle, R + 22);
        const anchor =
          Math.abs(lp.x - CX) < 6 ? "middle" : lp.x > CX ? "start" : "end";
        return (
          <g key={ax.key}>
            <text
              x={lp.x}
              y={lp.y - 5}
              textAnchor={anchor}
              dominantBaseline="middle"
              fill="#4a3525"
              fontSize={10}
              fontWeight={600}
            >
              {t(ax.i18n)}
            </text>
            <text
              x={lp.x}
              y={lp.y + 8}
              textAnchor={anchor}
              dominantBaseline="middle"
              fill="#9a2a1b"
              fontSize={12}
              fontWeight={800}
            >
              {ax.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
