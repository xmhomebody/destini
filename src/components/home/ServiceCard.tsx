import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 服务卡片：圆形图标容器 + 卡西尔标题 + 衬线副文案
 * 整张卡片可点击，跳转到对应模块详情页
 */
type ServiceCardProps = {
  href: string;
  title: string;
  /** 副文案，使用 \n 分隔以保留两行竖排断行 */
  description: string;
  icon: ReactNode;
  /** 大尺寸卡片用于"相学"主推位 */
  size?: "sm" | "lg";
};

export function ServiceCard({
  href,
  title,
  description,
  icon,
  size = "sm",
}: ServiceCardProps) {
  const isLg = size === "lg";

  return (
    <Link
      href={href}
      className={`ornate-card group block ${
        isLg ? "p-5" : "p-4"
      } flex flex-col items-center text-center transition-transform duration-200 hover:-translate-y-0.5`}
    >
      {/* 圆形图标容器：羊皮纸内胆 + 金线描边 */}
      <div
        className={`rounded-full bg-parchment-dark border border-gold mb-3 flex items-center justify-center overflow-hidden ${
          isLg ? "w-24 h-24" : "w-20 h-20"
        }`}
      >
        <div className={isLg ? "w-14 h-14" : "w-12 h-12"}>{icon}</div>
      </div>

      <h2
        className={`font-[family-name:var(--font-cinzel)] text-cinnabar mb-1 ${
          isLg ? "text-xl" : "text-lg"
        }`}
      >
        {title}
      </h2>

      <p
        className={`text-ink-dark opacity-90 leading-snug ${
          isLg ? "text-xs leading-relaxed" : "text-[10px]"
        }`}
      >
        {description.split("\n").map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>
    </Link>
  );
}
