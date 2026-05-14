"use client";

import Image from "next/image";
import { ServiceCard } from "./ServiceCard";
import { useT } from "@/lib/i18n";

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
  const t = useT();
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
        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/physiognomy"
            title={t("home.service.face.title")}
            description={t("home.service.face.desc")}
            icon={<CardIcon src="/images/icon_index_face.png" />}
            iconFill
          />
          <ServiceCard
            href="/palmistry"
            title={t("home.service.palm.title")}
            description={t("home.service.palm.desc")}
            icon={<CardIcon src="/images/icon_index_palm.png" />}
            iconFill
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/bazi"
            title={t("home.service.bazi.title")}
            description={t("home.service.bazi.desc")}
            icon={<CardIcon src="/images/icon_index_bazi.png" />}
            iconFill
          />
          <ServiceCard
            href="/liuyao"
            title={t("home.service.liuyao.title")}
            description={t("home.service.liuyao.desc")}
            icon={<CardIcon src="/images/icon_index_liuyao.png" />}
            iconFill
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/naming"
            title={t("home.service.naming.title")}
            description={t("home.service.naming.desc")}
            icon={<CardIcon src="/images/icon_index_naming.png" />}
            iconFill
          />
          <ServiceCard
            href="/healing"
            title={t("home.service.healing.title")}
            description={t("home.service.healing.desc")}
            icon={<CardIcon src="/images/icon_index_healing.png" />}
            iconFill
          />
        </div>
      </div>
    </main>
  );
}
