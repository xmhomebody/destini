import type * as FaceApiNS from "face-api.js";

export type Pt = { x: number; y: number };
export type LabelAlign = "start" | "middle" | "end";

export type Feature = {
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

// =============================================================================
// Feature derivation
// =============================================================================

export function buildFeatures(
  detection: FaceApiNS.WithFaceLandmarks<{ detection: FaceApiNS.FaceDetection }, FaceApiNS.FaceLandmarks68>,
): Feature[] {
  const lm = detection.landmarks;
  const pos = lm.positions;
  const jaw = lm.getJawOutline();
  const rightBrow = lm.getRightEyeBrow(); // subject's right, image-left
  const leftBrow = lm.getLeftEyeBrow(); // subject's left, image-right
  const outerLips = lm.getMouth().slice(0, 12);

  // Outer brow ends (subject's right = image-left side)
  const browInnerR = rightBrow[rightBrow.length - 1]; // landmark 21
  const browInnerL = leftBrow[0]; // landmark 22
  const browOuterR = rightBrow[0]; // landmark 17
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

export function resolveLabelCollisions(features: Feature[], faceH: number) {
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
