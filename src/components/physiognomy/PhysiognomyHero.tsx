/**
 * 相学页首屏标题
 * 朱砂大写双行标题 + 金线分隔
 */
export function PhysiognomyHero() {
  return (
    <header className="text-center mt-6 mb-6 px-4">
      <h1 className="font-[family-name:var(--font-cinzel)] text-3xl sm:text-4xl tracking-[0.18em] uppercase text-cinnabar leading-[1.15]">
        Physiognomy
        <span className="block">Reading</span>
      </h1>

      {/* 金线 + 中央菱形分隔，与首页 Hero 呼应 */}
      <div className="flex justify-center items-center mt-4 opacity-70" aria-hidden>
        <span className="block h-px w-12 bg-gold" />
        <svg
          className="mx-2"
          fill="none"
          height="10"
          viewBox="0 0 12 10"
          width="12"
        >
          <path
            d="M6 1L9 5L6 9L3 5L6 1Z"
            stroke="var(--color-gold)"
            strokeWidth="1"
          />
        </svg>
        <span className="block h-px w-12 bg-gold" />
      </div>
    </header>
  );
}
