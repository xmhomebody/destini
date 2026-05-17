/**
 * 面相 AI 详细分析报告
 *
 * 调用 Google Gemini 视觉模型，依据传统面相学（三停 / 五官 / 十二宫 /
 * 重点部位 / 脸型骨相）对正面照片做结构化解读。
 *
 * 为兼顾速度，每次只生成「一种语言」的文本（约 15-25s）：
 *  - 首次生成（withScores=true）：返回该语言文本 + 六维评分（评分与语言无关，只生成一次）
 *  - 切换语言时（withScores=false）：仅按需补生成目标语言文本
 *
 * 注意：所有内容仅作传统文化参考，不构成任何决策建议。
 */

export type FaceReportContent = {
  /** 综合格局总论 */
  overview: string;
  /** 一、三停总论 */
  santing: { shangting: string; zhongting: string; xiating: string };
  /** 二、五官观察 */
  wuguan: {
    mei: string;
    yan: string;
    bi: string;
    kou: string;
    er: string;
  };
  /** 三、十二宫 */
  shierGong: {
    ming: string;
    caibo: string;
    xiongdi: string;
    tianzhai: string;
    ziNv: string;
    nupu: string;
    fuqi: string;
    jie: string;
    qianyi: string;
    guanlu: string;
    fude: string;
    fumu: string;
  };
  /** 四、重点部位详解 */
  keyParts: {
    etou: string;
    yintang: string;
    shangen: string;
    quangu: string;
    renzhong: string;
    faling: string;
    chunchi: string;
    diage: string;
  };
  /** 五、整体格局 */
  extras: {
    lianxing: string;
    guxiang: string;
    duichen: string;
    qise: string;
    zhiba: string;
  };
};

/** 六维评分 + 综合总分，0–100，与语言无关 */
export type FaceScores = {
  /** 智慧 / 思辨力 */
  wisdom: number;
  /** 行动力 / 事业心 */
  drive: number;
  /** 财富力 */
  wealth: number;
  /** 情感力 */
  emotion: number;
  /** 人缘 / 影响力 */
  charisma: number;
  /** 福气 / 心性 */
  fortune: number;
  /** 综合格局总分 */
  overall: number;
};

export type ReportLang = "en" | "fr" | "de" | "it";

/** 存入 sessionStorage 的形态：评分恒有；文本按语言惰性填充 */
export type FaceReport = {
  scores: FaceScores;
  i18n: Partial<Record<ReportLang, FaceReportContent>>;
};

/** 单次生成的返回：评分仅首次（withScores）随附 */
export type GenerateResult = {
  scores?: FaceScores;
  content: FaceReportContent;
};

const LANG_NAMES: Record<ReportLang, string> = {
  en: "English",
  fr: "French",
  de: "German",
  it: "Italian",
};

const GEMINI_MODEL = "gemini-2.5-flash";

function buildPrompt(langName: string, withScores: boolean): string {
  return `You are a seasoned researcher of traditional Chinese physiognomy (Ma Yi Shen Xiang). Based on traditional physiognomy theory, produce a multi-dimensional cultural reading of this front-facing portrait.

This is a traditional-culture, entertainment-oriented reading. Keep the tone gentle, elegant and constructive. Avoid absolute claims and negative predictions. Do not make any medical judgement about health or disease.

Write ALL written text in ${langName}. Each text field should be 2–3 sentences, specific to the actual observed features (shape, width, fullness, lines, symmetry), not generic filler.
${
  withScores
    ? `
Also output "scores": rate the face on six dimensions plus an overall score, each an INTEGER from 0 to 100, derived from the observed facial features (the overall score is a holistic judgement, not a plain average):
   - wisdom    = wisdom & reasoning
   - drive     = drive & ambition
   - wealth    = wealth capacity
   - emotion   = emotional capacity
   - charisma  = charisma & influence
   - fortune   = fortune & temperament
   - overall   = overall composite
(The scores are language-independent; produce them once here.)
`
    : ""
}
Field meanings:
- overview: overall composite reading.
- santing (three courts): shangting = upper court, hairline→brows (early life, wisdom, foundation); zhongting = middle court, brows→nose tip (middle life, career, drive); xiating = lower court, nose tip→chin (later life, fortune, sustainment).
- wuguan (five officials): mei = eyebrows (preservation官); yan = eyes (monitoring官); bi = nose (judging官); kou = mouth (intake官); er = ears (listening官; if unclear in photo, comment on the outline culturally).
- shierGong (twelve palaces): ming = life palace (brow seal); caibo = wealth (nose head & wings); xiongdi = siblings (eyebrows); tianzhai = property (upper eyelids); ziNv = children (lower eyelids); nupu = subordinates (sides of chin); fuqi = spouse (eye tails); jie = health (mountain root); qianyi = travel/移 (temples near hairline); guanlu = career (centre of forehead); fude = fortune-virtue (above brows); fumu = parents (upper forehead, sun & moon horns).
- keyParts: etou = forehead (shape & lines); yintang = brow seal (between brows); shangen = mountain root (bridge start); quangu = cheekbones (power & relations); renzhong = philtrum; faling = nasolabial/authority lines; chunchi = lips & teeth; diage = chin & jaw (earth chamber).
- extras: lianxing = face shape in five-element terms (judge & explain: metal/wood/water/fire/earth); guxiang = bone structure; duichen = left-right symmetry; qise = complexion & lustre; zhiba = moles & scars location (if none clearly visible, say so honestly and give an overall impression).

Return ONLY the JSON object matching the given schema, with no extra text.`;
}

const SECTION_SCHEMA = (props: string[]) => ({
  type: "object",
  properties: Object.fromEntries(props.map((p) => [p, { type: "string" }])),
  required: props,
  propertyOrdering: props,
});

const CONTENT_SCHEMA = {
  type: "object",
  properties: {
    overview: { type: "string" },
    santing: SECTION_SCHEMA(["shangting", "zhongting", "xiating"]),
    wuguan: SECTION_SCHEMA(["mei", "yan", "bi", "kou", "er"]),
    shierGong: SECTION_SCHEMA([
      "ming",
      "caibo",
      "xiongdi",
      "tianzhai",
      "ziNv",
      "nupu",
      "fuqi",
      "jie",
      "qianyi",
      "guanlu",
      "fude",
      "fumu",
    ]),
    keyParts: SECTION_SCHEMA([
      "etou",
      "yintang",
      "shangen",
      "quangu",
      "renzhong",
      "faling",
      "chunchi",
      "diage",
    ]),
    extras: SECTION_SCHEMA(["lianxing", "guxiang", "duichen", "qise", "zhiba"]),
  },
  required: ["overview", "santing", "wuguan", "shierGong", "keyParts", "extras"],
  propertyOrdering: [
    "overview",
    "santing",
    "wuguan",
    "shierGong",
    "keyParts",
    "extras",
  ],
};

const SCORE_KEYS = [
  "wisdom",
  "drive",
  "wealth",
  "emotion",
  "charisma",
  "fortune",
  "overall",
];

function buildResponseSchema(withScores: boolean) {
  const props: Record<string, unknown> = { content: CONTENT_SCHEMA };
  const required = ["content"];
  const ordering = ["content"];
  if (withScores) {
    props.scores = {
      type: "object",
      properties: Object.fromEntries(
        SCORE_KEYS.map((k) => [k, { type: "integer" }]),
      ),
      required: SCORE_KEYS,
      propertyOrdering: SCORE_KEYS,
    };
    required.unshift("scores");
    ordering.unshift("scores");
  }
  return {
    type: "object",
    properties: props,
    required,
    propertyOrdering: ordering,
  };
}

/** 把 data URL 拆成 { mimeType, base64 } */
export function parseDataUrl(
  dataUrl: string,
): { mimeType: string; base64: string } | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!m) return null;
  return { mimeType: m[1], base64: m[2] };
}

export async function generateFaceReport(
  base64: string,
  mimeType: string,
  lang: ReportLang,
  withScores: boolean,
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY environment variable");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt(LANG_NAMES[lang], withScores) },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 16384,
        responseMimeType: "application/json",
        responseSchema: buildResponseSchema(withScores),
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  return JSON.parse(stripFence(text)) as GenerateResult;
}

/** 去掉可能存在的 ```json ... ``` 围栏 */
function stripFence(text: string): string {
  const t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(t);
  return fence ? fence[1] : t;
}
