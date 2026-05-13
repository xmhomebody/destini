import Image from "next/image";
import { ServiceCard } from "./ServiceCard";

/**
 * 五大模块布局
 * 顶部主推：Face Reading / Palm Reading（相学）
 * 中行：Bazi / Liuyao
 * 底行：Naming / Healing
 * 背后叠加 Bagua 同心圆装饰，渲染天圆地方意象
 */
type CardIconProps = { src: string };
function CardIcon({ src }: CardIconProps) {
  return (
    <Image
      src={src}
      alt=""
      width={96}
      height={96}
      className="block w-full h-full object-cover"
    />
  );
}

export function Services() {
  return (
    <main className="flex-grow relative px-4 py-6 pb-4 flex flex-col items-center">
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
        {/* 主推：相学二分支 */}
        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/physiognomy"
            title="Face Reading"
            description={"Read the face,\nsee the destiny."}
            icon={<CardIcon src="/images/icon_index_face.png" />}
            iconFill
          />
          <ServiceCard
            href="/palmistry"
            title="Palm Reading"
            description={"Read the palm,\nknow your fate."}
            icon={<CardIcon src="/images/icon_index_palm.png" />}
            iconFill
          />
        </div>

        {/* 中行：八字 / 六爻 */}
        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/bazi"
            title="Bazi"
            description={"Decode your birth chart,\nuncover your path."}
            icon={<CardIcon src="/images/icon_index_bazi.png" />}
            iconFill
          />
          <ServiceCard
            href="/liuyao"
            title="Liuyao"
            description={"Cast the signs,\nreveal the change."}
            icon={<CardIcon src="/images/icon_index_liuyao.png" />}
            iconFill
          />
        </div>

        {/* 底行：起名 / 疗愈 */}
        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/naming"
            title="Naming"
            description={"A name aligned with fate,\na life in harmony."}
            icon={<CardIcon src="/images/icon_index_naming.png" />}
            iconFill
          />
          <ServiceCard
            href="/healing"
            title="Healing"
            description={"Restore balance,\nrenew your energy."}
            icon={<CardIcon src="/images/icon_index_healing.png" />}
            iconFill
          />
        </div>
      </div>
    </main>
  );
}
