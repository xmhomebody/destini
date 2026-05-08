/**
 * 顶部导航条
 * 左侧：金线圆形品牌点；中部：三组标签；右侧：菜单触发器
 */
export function TopNav() {
  return (
    <nav
      aria-label="Primary"
      className="w-full flex justify-between items-center p-4 text-[10px] tracking-widest text-ink-light uppercase"
    >
      {/* 品牌标识：金圈 + 实心金点 */}
      <div className="w-6 h-6 border border-gold rounded-full flex items-center justify-center">
        <span className="block w-3 h-3 bg-gold rounded-full opacity-50" />
      </div>

      {/* 三段式标语 */}
      <div className="flex gap-3 sm:gap-4 font-[family-name:var(--font-cinzel)]">
        <span>Destini</span>
        <span aria-hidden>•</span>
        <span>Insight</span>
        <span aria-hidden>•</span>
        <span>Harmony</span>
      </div>

      {/* 菜单图标：三道横线 */}
      <button
        type="button"
        aria-label="Open menu"
        className="w-6 h-4 flex flex-col justify-between cursor-pointer"
      >
        <span className="w-full h-px bg-ink-light" />
        <span className="w-full h-px bg-ink-light" />
        <span className="w-full h-px bg-ink-light" />
      </button>
    </nav>
  );
}
