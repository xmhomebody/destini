import Link from "next/link";

/**
 * 手相页顶部导航：与相学页一致的结构，仅标题切换
 */
export function PalmistryTopNav() {
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 w-full bg-[rgba(240,232,218,0.88)] backdrop-blur-sm border-b border-gold/30"
    >
      <div className="flex items-center justify-between px-4 py-3 w-full">
        <Link
          href="/"
          aria-label="Back to home"
          className="p-1.5 -ml-1.5 text-ink-light hover:text-cinnabar transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              d="M15.75 19.5L8.25 12l7.5-7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="flex flex-col items-center">
          <span className="font-[family-name:var(--font-cinzel)] text-xl tracking-[0.25em] text-cinnabar uppercase">
            Destini
          </span>
          <span className="mt-0.5 text-[9px] tracking-[0.25em] text-ink-light uppercase">
            Insight · Palmistry
          </span>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          className="p-1.5 -mr-1.5 text-ink-light hover:text-cinnabar transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}
