import { ServiceCard } from "./ServiceCard";
import {
  PhysiognomyIcon,
  BaziIcon,
  NamingIcon,
  LiuyaoIcon,
  HealingIcon,
} from "./ServiceIcons";

/**
 * 五大模块布局
 * 顶部主推：Physiognomy（相学）
 * 中行：Bazi / Naming
 * 底行：Liuyao / Healing
 * 背后叠加 Bagua 同心圆装饰，渲染天圆地方意象
 */
export function Services() {
  return (
    <main className="flex-grow relative px-4 py-8 flex flex-col items-center">
      {/* 装饰：八卦同心圆背景 */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0"
      >
        <div className="w-64 h-64 border border-ink-dark rounded-full border-dashed" />
        <div className="absolute w-48 h-48 border border-ink-dark rounded-full" />
        <div className="absolute w-32 h-32 border border-ink-dark rounded-full border-dashed" />
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6 relative z-10">
        {/* 主推：相学 */}
        <div className="w-full flex justify-center">
          <div className="w-4/5">
            <ServiceCard
              href="/physiognomy"
              title="Physiognomy"
              description={"Read the face,\nsee the destiny."}
              icon={<PhysiognomyIcon className="w-full h-full" />}
              size="lg"
            />
          </div>
        </div>

        {/* 中行：八字 / 起名 */}
        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/bazi"
            title="Bazi"
            description={"Decode your birth chart,\nuncover your path."}
            icon={<BaziIcon className="w-full h-full" />}
          />
          <ServiceCard
            href="/naming"
            title="Naming"
            description={"A name aligned with fate,\na life in harmony."}
            icon={<NamingIcon className="w-full h-full" />}
          />
        </div>

        {/* 底行：六爻 / 疗愈 */}
        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/liuyao"
            title="Liuyao"
            description={"Cast the signs,\nreveal the change."}
            icon={<LiuyaoIcon className="w-full h-full" />}
          />
          <ServiceCard
            href="/healing"
            title="Healing"
            description={"Restore balance,\nrenew your energy."}
            icon={<HealingIcon className="w-full h-full" />}
          />
        </div>
      </div>
    </main>
  );
}
