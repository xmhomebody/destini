/**
 * 掌纹提取 + 分类管线（纯 JS / Canvas，无 OpenCV.js 依赖）
 *
 *   1. MediaPipe 21 个手部关键点 → 推导掌心 ROI 多边形（剔除拇指与手指）
 *   2. Canvas 取灰度 → 对比度归一化 → 黑帽形态学（分离式 min/max 通过单调队列做 O(W·H)）→ 大津二值化 → ROI 掩膜
 *   3. 4-连通块标记取出每条候选纹路；对每个 blob 用 PCA 求主轴 → 分桶取中位点 → 平滑折线
 *   4. 几何评分：把每条折线投到掌心坐标（wrist 为原点，wrist→中指 MCP 为前向），用位置/朝向/跨度给四类纹路打分
 *   5. 贪心分配：每类各取一条（同一候选不被复用），低分阈值过滤掉杂纹
 *
 *   每个重计算阶段之间会 await tick() 让出主线程，避免 "Page Unresponsive"。
 *   坐标输出统一归一到 0..1（相对图像自然尺寸），调用方再投到 SVG。
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

type Pt = { x: number; y: number };

/** 五条主纹路：感情 / 智慧 / 生命 / 事业（命运）/ 婚姻 */
export type LineKey = "heart" | "head" | "life" | "fate" | "marriage";

/** 仅这四条由黑帽提取参与；婚姻线太短，仅用模板。*/
const EXTRACT_KEYS: ReadonlyArray<Exclude<LineKey, "marriage">> = [
  "heart",
  "head",
  "life",
  "fate",
];

export type ClassifiedLine = {
  key: LineKey;
  /** Polyline points in image-normalized coords (0..1) */
  points: Pt[];
};

/**
 * 基于 21 个关键点构造 5 条纹路的几何模板，单位为图像归一坐标。
 * 提取阶段命中的纹路会覆盖对应模板；没命中的就保留模板兜底。
 */
export function buildTemplateLines(landmarks: NormalizedLandmark[]): Record<LineKey, Pt[]> {
  const wrist = pt(landmarks[0]);
  const thumbCmc = pt(landmarks[1]);
  const indexMcp = pt(landmarks[5]);
  const middleMcp = pt(landmarks[9]);
  const ringMcp = pt(landmarks[13]);
  const pinkyMcp = pt(landmarks[17]);

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
  const headEnd = add(lerp(midpoint(wrist, pinkyMcp), pinkyMcp, 0.4), mul(fwd, fwdLen * 0.0));
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

function pt(l: NormalizedLandmark): Pt {
  return { x: l.x, y: l.y };
}
function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function midpoint(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
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

const MAX_DIM = 768;

/** 把主线程让出半帧，避免长时间同步阻塞触发 "Page Unresponsive"。*/
function tick(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function prepCanvas(img: HTMLImageElement): { canvas: HTMLCanvasElement } {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const longSide = Math.max(W, H);
  const scale = longSide > MAX_DIM ? MAX_DIM / longSide : 1;
  const cw = Math.max(1, Math.round(W * scale));
  const ch = Math.max(1, Math.round(H * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, cw, ch);
  return { canvas };
}

export async function extractPalmLines(
  img: HTMLImageElement,
  landmarks: NormalizedLandmark[],
): Promise<ClassifiedLine[]> {
  const { canvas } = prepCanvas(img);
  const W = canvas.width;
  const H = canvas.height;
  const N = W * H;

  // === Landmarks in working-canvas pixel space ===
  const wrist: Pt = { x: landmarks[0].x * W, y: landmarks[0].y * H };
  const thumbCmc: Pt = { x: landmarks[1].x * W, y: landmarks[1].y * H };
  const indexMcp: Pt = { x: landmarks[5].x * W, y: landmarks[5].y * H };
  const middleMcp: Pt = { x: landmarks[9].x * W, y: landmarks[9].y * H };
  const ringMcp: Pt = { x: landmarks[13].x * W, y: landmarks[13].y * H };
  const pinkyMcp: Pt = { x: landmarks[17].x * W, y: landmarks[17].y * H };

  const fwdRaw = sub(middleMcp, wrist);
  const fwdLen = Math.hypot(fwdRaw.x, fwdRaw.y) || 1;
  const fwd: Pt = { x: fwdRaw.x / fwdLen, y: fwdRaw.y / fwdLen };
  const perpRaw: Pt = { x: -fwd.y, y: fwd.x };
  const perpSign = dot(perpRaw, sub(pinkyMcp, wrist)) >= 0 ? 1 : -1;
  const acrossPinky: Pt = { x: perpRaw.x * perpSign, y: perpRaw.y * perpSign };

  // === Palm ROI polygon ===
  const topPull = -0.1 * fwdLen;
  const widen = 0.04 * fwdLen;
  const polygon: Pt[] = [
    add(wrist, mul(acrossPinky, -widen)),
    add(thumbCmc, mul(fwd, -0.05 * fwdLen)),
    add(thumbCmc, mul(fwd, 0.15 * fwdLen)),
    add(indexMcp, mul(fwd, topPull)),
    add(middleMcp, mul(fwd, topPull)),
    add(ringMcp, mul(fwd, topPull)),
    add(pinkyMcp, mul(fwd, topPull)),
    add(pinkyMcp, mul(acrossPinky, widen)),
    add(wrist, mul(acrossPinky, widen * 1.5)),
  ];

  const ctx = canvas.getContext("2d")!;
  const rgba = ctx.getImageData(0, 0, W, H).data;

  // 1. 灰度
  const gray = new Uint8ClampedArray(N);
  for (let i = 0, p = 0; i < N; i++, p += 4) {
    gray[i] = (rgba[p] * 0.299 + rgba[p + 1] * 0.587 + rgba[p + 2] * 0.114) | 0;
  }
  await tick();

  // 2. 掌心多边形掩膜 (1 = inside palm, 0 = outside)
  const mask = polygonMask(polygon, W, H);
  await tick();

  // 3. 仅在 ROI 内做对比度拉伸（避免被背景大暗块拉偏）
  stretchContrastInMask(gray, mask);
  await tick();

  // 4. 黑帽形态学：closing(g) - g
  const kSize = Math.max(11, Math.round(Math.min(W, H) * 0.025)) | 1;
  const dilated = morphologySeparable(gray, W, H, kSize, "max");
  await tick();
  const closed = morphologySeparable(dilated, W, H, kSize, "min");
  await tick();
  const blackhat = new Uint8ClampedArray(N);
  for (let i = 0; i < N; i++) {
    blackhat[i] = mask[i] ? Math.max(0, closed[i] - gray[i]) : 0;
  }
  await tick();

  // 5. Otsu 二值化（只对 ROI 内非零像素求阈值）
  const t = otsu(blackhat, mask);
  const binary = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    binary[i] = blackhat[i] > t ? 1 : 0;
  }
  await tick();

  // 6. 4-连通块 → 候选纹路
  const blobs = connectedComponents(binary, W, H);
  await tick();

  const minLengthPx = fwdLen * 0.28;
  const minArea = Math.max(20, kSize * 2);

  const candidates: { points: Pt[]; lengthPx: number }[] = [];
  for (const blob of blobs) {
    if (blob.length < minArea) continue;
    const polyline = polylineFromBlob(blob, W);
    if (!polyline) continue;
    if (polyline.lengthPx < minLengthPx) continue;
    candidates.push(polyline);
  }
  await tick();

  const classified = classify(candidates, { wrist, fwd, acrossPinky, fwdLen });

  return classified.map((line) => ({
    key: line.key,
    points: line.points.map((p) => ({ x: p.x / W, y: p.y / H })),
  }));
}

// =============================================================================
// Palm-polygon mask (scanline fill)
// =============================================================================

function polygonMask(polygon: Pt[], W: number, H: number): Uint8Array {
  const mask = new Uint8Array(W * H);
  // Bounding box
  let yMin = Infinity,
    yMax = -Infinity;
  for (const p of polygon) {
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  yMin = Math.max(0, Math.floor(yMin));
  yMax = Math.min(H - 1, Math.ceil(yMax));

  const np = polygon.length;
  const xs: number[] = [];
  for (let y = yMin; y <= yMax; y++) {
    xs.length = 0;
    for (let i = 0, j = np - 1; i < np; j = i++) {
      const pi = polygon[i];
      const pj = polygon[j];
      if ((pi.y > y) !== (pj.y > y)) {
        const t = (y - pi.y) / (pj.y - pi.y);
        xs.push(pi.x + t * (pj.x - pi.x));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k < xs.length; k += 2) {
      const xLo = Math.max(0, Math.floor(xs[k]));
      const xHi = Math.min(W - 1, Math.ceil(xs[k + 1] ?? xs[k]));
      const row = y * W;
      for (let x = xLo; x <= xHi; x++) mask[row + x] = 1;
    }
  }
  return mask;
}

// =============================================================================
// In-place contrast stretch on ROI pixels (percentiles 2..98)
// =============================================================================

function stretchContrastInMask(gray: Uint8ClampedArray, mask: Uint8Array): void {
  const hist = new Uint32Array(256);
  let total = 0;
  for (let i = 0; i < gray.length; i++) {
    if (mask[i]) {
      hist[gray[i]]++;
      total++;
    }
  }
  if (total === 0) return;
  const lowTarget = total * 0.02;
  const highTarget = total * 0.98;
  let acc = 0;
  let lo = 0,
    hi = 255;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= lowTarget) {
      lo = v;
      break;
    }
  }
  acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= highTarget) {
      hi = v;
      break;
    }
  }
  if (hi <= lo) return;
  const scale = 255 / (hi - lo);
  for (let i = 0; i < gray.length; i++) {
    if (!mask[i]) continue;
    const v = gray[i];
    if (v <= lo) gray[i] = 0;
    else if (v >= hi) gray[i] = 255;
    else gray[i] = ((v - lo) * scale) | 0;
  }
}

// =============================================================================
// Separable rectangular morphology via monotonic deques — O(W·H)
// =============================================================================

type MorphOp = "min" | "max";

function morphologySeparable(
  src: Uint8ClampedArray,
  W: number,
  H: number,
  k: number,
  op: MorphOp,
): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(W * H);
  // Horizontal
  for (let y = 0; y < H; y++) {
    slidingWindow1D(src, tmp, y * W, 1, W, k, op);
  }
  const out = new Uint8ClampedArray(W * H);
  // Vertical
  for (let x = 0; x < W; x++) {
    slidingWindow1D(tmp, out, x, W, H, k, op);
  }
  return out;
}

/**
 * 单方向滑动窗口 min/max，使用单调双端队列 → 每像素 O(1)。
 * `start` + `step` 提供广义的行/列遍历起点和步长。
 */
function slidingWindow1D(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  start: number,
  step: number,
  length: number,
  k: number,
  op: MorphOp,
): void {
  const half = (k - 1) >> 1;
  // Deque of indices i (into the line). Front is the candidate winner.
  const dq = new Int32Array(length);
  let head = 0;
  let tail = 0;
  const cmp = op === "max" ? (a: number, b: number) => a >= b : (a: number, b: number) => a <= b;

  for (let i = 0; i < length; i++) {
    const v = src[start + i * step];
    // Pop tail while it's "worse" than incoming value
    while (head < tail && cmp(v, src[start + dq[tail - 1] * step])) {
      tail--;
    }
    dq[tail++] = i;
    // Drop front if it's outside window
    while (dq[head] < i - k + 1) head++;

    // Once we have processed i = half pixels ahead of the window center, write output
    const outIdx = i - half;
    if (outIdx >= 0) {
      // For edges where window is smaller than k, this still works as best-of-available
      dst[start + outIdx * step] = src[start + dq[head] * step];
    }
  }
  // Tail edge: pixels [length - half, length - 1] still need outputs
  for (let outIdx = length - half; outIdx < length; outIdx++) {
    while (head < tail && dq[head] < outIdx - k + 1) head++;
    if (head < tail) {
      dst[start + outIdx * step] = src[start + dq[head] * step];
    } else {
      dst[start + outIdx * step] = src[start + outIdx * step];
    }
  }
}

// =============================================================================
// Otsu threshold (limited to mask)
// =============================================================================

function otsu(values: Uint8ClampedArray, mask: Uint8Array): number {
  const hist = new Uint32Array(256);
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    if (!mask[i]) continue;
    hist[values[i]]++;
    total++;
  }
  if (total === 0) return 0;

  let sum = 0;
  for (let v = 0; v < 256; v++) sum += v * hist[v];

  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 0;
  for (let v = 0; v < 256; v++) {
    wB += hist[v];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += v * hist[v];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) {
      maxVar = between;
      threshold = v;
    }
  }
  // 适当抬升阈值，过滤纤细噪点
  return Math.max(threshold, 12);
}

// =============================================================================
// 4-connected components (iterative flood fill)
// =============================================================================

function connectedComponents(binary: Uint8Array, W: number, H: number): Pt[][] {
  const labels = new Int32Array(W * H); // 0 = unlabeled / background
  const blobs: Pt[][] = [];
  const stackX = new Int32Array(W * H);
  const stackY = new Int32Array(W * H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (!binary[idx] || labels[idx]) continue;

      const blob: Pt[] = [];
      let sp = 0;
      stackX[sp] = x;
      stackY[sp] = y;
      sp++;
      labels[idx] = blobs.length + 1;

      while (sp > 0) {
        sp--;
        const cx = stackX[sp];
        const cy = stackY[sp];
        blob.push({ x: cx, y: cy });
        // 4-neighbors
        if (cx > 0) {
          const ni = cy * W + (cx - 1);
          if (binary[ni] && !labels[ni]) {
            labels[ni] = blobs.length + 1;
            stackX[sp] = cx - 1;
            stackY[sp] = cy;
            sp++;
          }
        }
        if (cx < W - 1) {
          const ni = cy * W + (cx + 1);
          if (binary[ni] && !labels[ni]) {
            labels[ni] = blobs.length + 1;
            stackX[sp] = cx + 1;
            stackY[sp] = cy;
            sp++;
          }
        }
        if (cy > 0) {
          const ni = (cy - 1) * W + cx;
          if (binary[ni] && !labels[ni]) {
            labels[ni] = blobs.length + 1;
            stackX[sp] = cx;
            stackY[sp] = cy - 1;
            sp++;
          }
        }
        if (cy < H - 1) {
          const ni = (cy + 1) * W + cx;
          if (binary[ni] && !labels[ni]) {
            labels[ni] = blobs.length + 1;
            stackX[sp] = cx;
            stackY[sp] = cy + 1;
            sp++;
          }
        }
      }
      blobs.push(blob);
    }
  }
  return blobs;
}

// =============================================================================
// PCA polyline (bin-median along major axis)
// =============================================================================

function polylineFromBlob(pts: Pt[], W: number): { points: Pt[]; lengthPx: number } | null {
  void W;
  const N = pts.length;
  if (N < 16) return null;

  let mx = 0,
    my = 0;
  for (const p of pts) {
    mx += p.x;
    my += p.y;
  }
  mx /= N;
  my /= N;

  let sxx = 0,
    syy = 0,
    sxy = 0;
  for (const p of pts) {
    const dx = p.x - mx;
    const dy = p.y - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  sxx /= N;
  syy /= N;
  sxy /= N;

  const tr = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const lam1 = tr / 2 + disc;

  let vx: number, vy: number;
  if (Math.abs(sxy) > 1e-6) {
    vx = lam1 - syy;
    vy = sxy;
  } else if (sxx >= syy) {
    vx = 1;
    vy = 0;
  } else {
    vx = 0;
    vy = 1;
  }
  const vm = Math.hypot(vx, vy) || 1;
  vx /= vm;
  vy /= vm;

  const projected = new Float32Array(N);
  let tMin = Infinity,
    tMax = -Infinity;
  for (let i = 0; i < N; i++) {
    const t = (pts[i].x - mx) * vx + (pts[i].y - my) * vy;
    projected[i] = t;
    if (t < tMin) tMin = t;
    if (t > tMax) tMax = t;
  }
  const tRange = tMax - tMin;
  if (tRange < 12) return null;

  const N_BINS = 16;
  const buckets: Pt[][] = Array.from({ length: N_BINS }, () => []);
  for (let i = 0; i < N; i++) {
    let b = Math.floor(((projected[i] - tMin) / tRange) * N_BINS);
    if (b >= N_BINS) b = N_BINS - 1;
    if (b < 0) b = 0;
    buckets[b].push(pts[i]);
  }

  const polyline: Pt[] = [];
  for (const bucket of buckets) {
    if (bucket.length === 0) continue;
    const xs = bucket.map((p) => p.x).sort((a, b) => a - b);
    const ys = bucket.map((p) => p.y).sort((a, b) => a - b);
    polyline.push({
      x: xs[Math.floor(xs.length / 2)],
      y: ys[Math.floor(ys.length / 2)],
    });
  }
  if (polyline.length < 3) return null;

  let lengthPx = 0;
  for (let i = 1; i < polyline.length; i++) {
    lengthPx += Math.hypot(
      polyline[i].x - polyline[i - 1].x,
      polyline[i].y - polyline[i - 1].y,
    );
  }
  return { points: polyline, lengthPx };
}

// =============================================================================
// Classification (unchanged from prior version)
// =============================================================================

type Frame = {
  wrist: Pt;
  fwd: Pt;
  acrossPinky: Pt;
  fwdLen: number;
};

function classify(
  candidates: { points: Pt[]; lengthPx: number }[],
  frame: Frame,
): { key: LineKey; points: Pt[] }[] {
  if (candidates.length === 0) return [];

  type FeatureRow = {
    points: Pt[];
    f: number;
    a: number;
    fMin: number;
    fMax: number;
    aMin: number;
    aMax: number;
    forwardSpan: number;
    acrossSpan: number;
    tilt: number;
    len: number;
  };

  const features: FeatureRow[] = candidates.map((c) => {
    const palmPts = c.points.map((p) => toPalm(p, frame));
    const f = avgArr(palmPts.map((p) => p.f));
    const a = avgArr(palmPts.map((p) => p.a));
    let fMin = Infinity,
      fMax = -Infinity,
      aMin = Infinity,
      aMax = -Infinity;
    for (const p of palmPts) {
      if (p.f < fMin) fMin = p.f;
      if (p.f > fMax) fMax = p.f;
      if (p.a < aMin) aMin = p.a;
      if (p.a > aMax) aMax = p.a;
    }
    const forwardSpan = fMax - fMin;
    const acrossSpan = aMax - aMin;
    const tilt = Math.atan2(forwardSpan, Math.max(0.01, acrossSpan));
    return {
      points: c.points,
      f,
      a,
      fMin,
      fMax,
      aMin,
      aMax,
      forwardSpan,
      acrossSpan,
      tilt,
      len: c.lengthPx / frame.fwdLen,
    };
  });

  type ExtractKey = (typeof EXTRACT_KEYS)[number];

  function score(f: FeatureRow, key: ExtractKey): number {
    switch (key) {
      case "heart":
        return (
          -Math.abs(f.f - 0.78) * 5 +
          -Math.max(0, f.tilt - 0.55) * 4 +
          f.acrossSpan * 2.5 +
          f.len * 1.0 +
          (f.f < 0.55 ? -3 : 0)
        );
      case "head":
        return (
          -Math.abs(f.f - 0.55) * 5 +
          -Math.max(0, f.tilt - 0.55) * 4 +
          f.acrossSpan * 2.0 +
          f.len * 1.0 +
          (f.f > 0.75 || f.f < 0.3 ? -3 : 0)
        );
      case "life":
        return (
          -Math.max(0, f.a + 0.0) * 4 +
          -Math.abs(f.f - 0.45) * 2.5 +
          f.len * 2.0 +
          (f.aMin < -0.15 ? 2 : 0) +
          (f.a > 0.1 ? -4 : 0)
        );
      case "fate":
        return (
          -Math.abs(f.a) * 5 +
          Math.max(0, f.tilt - 0.6) * 4 +
          f.forwardSpan * 2.0 +
          f.len * 1.0 +
          (Math.abs(f.a) > 0.25 ? -3 : 0)
        );
    }
  }

  // 由于模板兜底，提取阶段尽量宽松地分类（贪心+负分阈值）
  const triples: { row: FeatureRow; key: ExtractKey; s: number }[] = [];
  for (const row of features) {
    for (const k of EXTRACT_KEYS) {
      triples.push({ row, key: k, s: score(row, k) });
    }
  }
  triples.sort((a, b) => b.s - a.s);

  const assignedClass = new Set<ExtractKey>();
  const usedRow = new Set<FeatureRow>();
  const out: { key: LineKey; points: Pt[] }[] = [];
  for (const t of triples) {
    if (assignedClass.has(t.key)) continue;
    if (usedRow.has(t.row)) continue;
    if (t.s < -2.0) continue;
    assignedClass.add(t.key);
    usedRow.add(t.row);
    out.push({ key: t.key, points: orientFor(t.key, t.row.points, frame) });
    if (assignedClass.size === EXTRACT_KEYS.length) break;
  }
  return out;
}

function orientFor(key: (typeof EXTRACT_KEYS)[number], points: Pt[], frame: Frame): Pt[] {
  const first = toPalm(points[0], frame);
  const last = toPalm(points[points.length - 1], frame);
  let reverse = false;
  switch (key) {
    case "heart":
    case "head":
      reverse = last.a > first.a;
      break;
    case "life":
      reverse = first.f < last.f;
      break;
    case "fate":
      reverse = first.f > last.f;
      break;
  }
  return reverse ? [...points].reverse() : points;
}

// =============================================================================
// Vector helpers
// =============================================================================

function toPalm(p: Pt, frame: Frame): { f: number; a: number } {
  const dx = p.x - frame.wrist.x;
  const dy = p.y - frame.wrist.y;
  return {
    f: (dx * frame.fwd.x + dy * frame.fwd.y) / frame.fwdLen,
    a: (dx * frame.acrossPinky.x + dy * frame.acrossPinky.y) / frame.fwdLen,
  };
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
function avgArr(arr: number[]): number {
  if (arr.length === 0) return 0;
  let s = 0;
  for (const n of arr) s += n;
  return s / arr.length;
}
