import Link from "next/link";

/**
 * 主行动召唤按钮
 * 朱砂烫金风格，模拟印章压在卷轴上的视觉
 */
export function HomeCta() {
  return (
    <section className="w-full px-6 py-6 relative z-10 flex flex-col items-center">
      <Link
        href="/start"
        className="btn-cinnabar w-full max-w-[280px] py-4 rounded-full font-[family-name:var(--font-cinzel)] text-lg tracking-wider flex items-center justify-center gap-3"
      >
        <span>Begin Your Reading</span>
        <svg
          aria-hidden
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 5l7 7-7 7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </Link>
    </section>
  );
}
