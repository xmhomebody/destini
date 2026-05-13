/**
 * 5 条手相纹路的几何模板
 *
 * 每条都用「起点 + 终点 + 单点曲率偏移」组成的二次贝塞尔弧 → 始终单向弯曲、不会产生 S 形或锯齿。
 * 全部用 21 个 MediaPipe 手部关键点锚定，输出为 0..1 归一化图像坐标。
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

type Pt = { x: number; y: number };

export type LineKey = "heart" | "head" | "life" | "fate" | "marriage";

export type PalmLine = {
  key: LineKey;
  /** Polyline samples along a smooth quadratic arc */
  points: Pt[];
};

/** 用二次贝塞尔在 p0 → p1 间撒 n 个等参点；ctrlOff 是相对中点的控制点偏移。*/
function arc(p0: Pt, p1: Pt, ctrlOff: Pt, samples = 14): Pt[] {
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

export function buildPalmLines(landmarks: NormalizedLandmark[]): Record<LineKey, Pt[]> {
  const wrist = pt(landmarks[0]);
  const thumbCmc = pt(landmarks[1]);
  const indexMcp = pt(landmarks[5]);
  const middleMcp = pt(landmarks[9]);
  const ringMcp = pt(landmarks[13]);
  const pinkyMcp = pt(landmarks[17]);

  // 掌心几何基底：wrist 为原点，wrist→中指 MCP 为前向，垂直方向指向 pinky 一侧
  const fwdRaw = sub(middleMcp, wrist);
  const fwdLen = Math.hypot(fwdRaw.x, fwdRaw.y) || 1;
  const fwd = mul(fwdRaw, 1 / fwdLen);
  const perpRaw = { x: -fwd.y, y: fwd.x };
  const perpSign = dot(perpRaw, sub(pinkyMcp, wrist)) >= 0 ? 1 : -1;
  const acrossPinky = mul(perpRaw, perpSign);
  const acrossThumb = mul(acrossPinky, -1);

  // === 感情线：上掌长弧，朝手指方向轻拱 ===
  const heartStart = add(lerp(pinkyMcp, ringMcp, 0.45), mul(fwd, -fwdLen * 0.05));
  const heartEnd = add(lerp(indexMcp, thumbCmc, 0.32), mul(fwd, -fwdLen * 0.04));
  const heart = arc(heartStart, heartEnd, mul(fwd, -fwdLen * 0.08));

  // === 智慧线：中掌长弧，朝腕方向极轻拱 ===
  const headStart = add(lerp(thumbCmc, indexMcp, 0.55), mul(fwd, fwdLen * 0.02));
  const headEnd = add(lerp(palm(wrist, pinkyMcp), pinkyMcp, 0.4), mul(fwd, fwdLen * 0.0));
  const head = arc(headStart, headEnd, mul(fwd, fwdLen * 0.04));

  // === 生命线：从食指与拇指之间，绕拇指根弧到腕侧 ===
  const lifeStart = add(lerp(thumbCmc, indexMcp, 0.4), mul(fwd, fwdLen * 0.02));
  const lifeEnd = add(lerp(thumbCmc, wrist, 0.85), mul(acrossThumb, fwdLen * 0.02));
  const life = arc(lifeStart, lifeEnd, mul(acrossThumb, fwdLen * 0.16));

  // === 事业线 / 命运线：腕部纵向上行，朝中指根方向，极轻往 pinky 弯一点 ===
  const fateStart = add(wrist, mul(fwd, fwdLen * 0.08));
  const fateEnd = add(middleMcp, mul(fwd, -fwdLen * 0.16));
  const fate = arc(fateStart, fateEnd, mul(acrossPinky, fwdLen * 0.03));

  // === 婚姻线：pinky 侧短弧，介于感情线与小指根之间 ===
  const marriageBase = add(wrist, mul(fwd, fwdLen * 0.86));
  const marriageOuter = add(marriageBase, mul(acrossPinky, fwdLen * 0.45));
  const marriageInner = add(marriageBase, mul(acrossPinky, fwdLen * 0.22));
  const marriage = arc(marriageOuter, marriageInner, mul(fwd, fwdLen * 0.005), 8);

  return { heart, head, life, fate, marriage };
}

// =============================================================================
// Helpers
// =============================================================================

function pt(l: NormalizedLandmark): Pt {
  return { x: l.x, y: l.y };
}
function add(a: Pt, b: Pt): Pt {
  return { x: a.x + b.x, y: a.y + b.y };
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
function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
/** 取两点中点（掌心估计） */
function palm(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
