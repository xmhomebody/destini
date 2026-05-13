/**
 * 五大模块的主题 SVG 图标
 * 风格：金线描边 (#c2a878)，与古卷羊皮纸底色形成低饱和对比
 */

const stroke = "#7A6555";
const accent = "#9A2A1B";

/** 相学：抽象眼睛 + 面部轮廓 */
export function PhysiognomyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="32" cy="34" rx="18" ry="22" stroke={stroke} strokeWidth="1.5" />
      <ellipse cx="24" cy="30" rx="3" ry="2" stroke={stroke} strokeWidth="1.5" />
      <ellipse cx="40" cy="30" rx="3" ry="2" stroke={stroke} strokeWidth="1.5" />
      <circle cx="24" cy="30" r="0.8" fill={accent} />
      <circle cx="40" cy="30" r="0.8" fill={accent} />
      <path d="M28 42 Q32 45 36 42" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 18 V14" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** 八字：四柱网格（代表年月日时四柱八个字） */
export function BaziIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="14" y="14" width="36" height="36" stroke={stroke} strokeWidth="1.5" rx="2" />
      <line x1="23" y1="14" x2="23" y2="50" stroke={stroke} strokeWidth="1" />
      <line x1="32" y1="14" x2="32" y2="50" stroke={stroke} strokeWidth="1" />
      <line x1="41" y1="14" x2="41" y2="50" stroke={stroke} strokeWidth="1" />
      <line x1="14" y1="32" x2="50" y2="32" stroke={stroke} strokeWidth="1" />
      <circle cx="18.5" cy="23" r="1.5" fill={accent} />
      <circle cx="45.5" cy="41" r="1.5" fill={accent} />
    </svg>
  );
}

/** 起名：毛笔笔锋 + 印章 */
export function NamingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 48 C 22 36, 30 26, 44 18"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M44 18 L 50 12 L 48 22 Z"
        fill={stroke}
        stroke={stroke}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <rect x="14" y="44" width="10" height="10" rx="1.5" fill={accent} opacity="0.85" />
      <text
        x="19"
        y="52"
        textAnchor="middle"
        fontSize="7"
        fill="#F0E8DA"
        fontFamily="serif"
        fontWeight="700"
      >
        名
      </text>
    </svg>
  );
}

/** 六爻：三爻卦象 + 古钱币 */
export function LiuyaoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 三爻：阳-阴-阳 */}
      <line x1="14" y1="20" x2="50" y2="20" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="32" x2="27" y2="32" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="37" y1="32" x2="50" y2="32" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="44" x2="50" y2="44" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      {/* 中央铜钱方孔 */}
      <circle cx="32" cy="56" r="5" stroke={accent} strokeWidth="1.5" fill="none" />
      <rect x="30" y="54" width="4" height="4" stroke={accent} strokeWidth="1" fill="none" />
    </svg>
  );
}

/** 手相：手掌轮廓 + 掌纹线 */
export function PalmReadingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 手掌轮廓 */}
      <path
        d="M22 52 C18 52 14 48 14 44 L14 28 C14 26 16 24 18 24 L18 18 C18 16 20 14 22 14 C24 14 26 16 26 18 L26 22 C26 20 28 18 30 18 C32 18 34 20 34 22 L34 22 C34 20 36 18 38 18 C40 18 42 20 42 22 L42 24 C44 24 46 26 46 28 L46 38 C46 44 42 52 36 52 Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* 生命线 */}
      <path d="M22 42 C24 36 24 30 22 24" stroke={accent} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      {/* 感情线 */}
      <path d="M22 34 C28 32 34 32 40 34" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
      {/* 智慧线 */}
      <path d="M22 38 C27 37 33 36 38 38" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** 疗愈：八瓣莲花 */
export function HealingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(32 32)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-12"
            rx="5"
            ry="12"
            stroke={stroke}
            strokeWidth="1.2"
            fill="none"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="3" fill={accent} opacity="0.8" />
      </g>
    </svg>
  );
}
