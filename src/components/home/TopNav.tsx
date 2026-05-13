/**
 * 顶部导航条
 * 左侧：金线圆形品牌点；中部：三组标签；右侧：菜单触发器
 */
export function TopNav() {
  return (
    <nav
      aria-label="Primary"
      className="w-full flex justify-center items-center p-4 text-[10px] tracking-widest text-ink-light uppercase"
    >
      {/* 三段式标语 */}
      <div className="flex gap-3 sm:gap-4 font-[family-name:var(--font-cinzel)]">
        <span>Destini</span>
        <span aria-hidden>•</span>
        <span>Insight</span>
        <span aria-hidden>•</span>
        <span>Harmony</span>
      </div>
    </nav>
  );
}
