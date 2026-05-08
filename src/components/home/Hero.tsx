/**
 * 首屏品牌区
 * 巨幅 Destini 标题 + 朱砂"天命"印章 + 副标题 + 装饰分隔线
 */
export function Hero() {
  return (
    <header className="text-center mt-6 px-4 relative z-10">
      <div className="flex justify-center items-start gap-2">
        <h1 className="font-[family-name:var(--font-cinzel)] text-6xl md:text-7xl text-cinnabar font-medium tracking-tight">
          Destini
        </h1>
        {/* 朱砂印章：竖排"天命"二字，呼应品牌词源 */}
        <div className="seal-stamp mt-2 font-bold" aria-label="天命">
          天命
        </div>
      </div>

      <p className="mt-4 text-sm tracking-wide text-ink-dark uppercase opacity-80">
        Ancient Insight, Ritual Guidance, Inner Healing
      </p>

      {/* 装饰分隔：菱形 + 双侧短线，模拟卷轴中缝纹饰 */}
      <div className="flex justify-center mt-6 opacity-60" aria-hidden>
        <svg
          fill="none"
          height="10"
          viewBox="0 0 40 10"
          width="40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 1L23 5L20 9L17 5L20 1Z" stroke="#C2A878" strokeWidth="1" />
          <line stroke="#C2A878" strokeWidth="1" x1="0" x2="15" y1="5" y2="5" />
          <line stroke="#C2A878" strokeWidth="1" x1="25" x2="40" y1="5" y2="5" />
        </svg>
      </div>
    </header>
  );
}
