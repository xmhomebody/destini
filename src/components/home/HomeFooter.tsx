/**
 * 页脚特性区 + 底部三段式 tagline
 * 三个特性：保密 / 传统 / 关怀
 */

type Feature = {
  label: string;
  sub: string;
  /** 自定义 SVG 路径，沿用 stroke="currentColor" */
  path: string;
};

const features: Feature[] = [
  {
    label: "Private",
    sub: "Confidential",
    path: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    label: "Rooted in",
    sub: "Tradition",
    path: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
  },
  {
    label: "Guided",
    sub: "with Care",
    path: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
];

export function HomeFooter() {
  return (
    <footer className="mt-4 pb-8 w-full">
      {/* 三个核心承诺 */}
      <div className="flex justify-center gap-6 px-6 mb-8 border-b border-gold/30 pb-6 w-[90%] mx-auto">
        {features.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center text-ink-light shrink-0">
              <svg
                aria-hidden
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d={f.path}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
            </div>
            <div className="text-[10px] text-ink-dark leading-tight">
              {f.label}
              <div>{f.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部三段式 tagline */}
      <div className="text-center flex justify-center items-center gap-4 text-[9px] tracking-[0.2em] text-ink-light uppercase pb-4">
        <span>Honoring Wisdom</span>
        <span aria-hidden>•</span>
        <span>Respecting Fate</span>
        <span aria-hidden>•</span>
        <span>Empowering You</span>
      </div>
    </footer>
  );
}
