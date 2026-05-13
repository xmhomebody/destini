import type { Metadata } from "next";
import { PhysiognomyTopNav } from "@/components/physiognomy/PhysiognomyTopNav";
import { PhysiognomyHero } from "@/components/physiognomy/PhysiognomyHero";
import { UploadCard } from "@/components/physiognomy/UploadCard";
import { InsightsCard } from "@/components/physiognomy/InsightsCard";
import { AnalysisCta } from "@/components/physiognomy/AnalysisCta";

export const metadata: Metadata = {
  title: "Physiognomy Reading — 麻衣神相 Face Reading",
  description:
    "Upload your portrait and receive a Ma Yi Shen Xiang face reading: forehead, eyes, nose, mouth & chin — each feature decoded against the canon of Chinese physiognomy.",
  alternates: { canonical: "/physiognomy" },
  openGraph: {
    title: "Physiognomy Reading · Destini",
    description:
      "An ink-and-parchment ritual interface for Chinese face reading, rooted in 麻衣神相 (Ma Yi Shen Xiang).",
    url: "/physiognomy",
    type: "website",
  },
};

export default function PhysiognomyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Physiognomy Reading",
    serviceType: "Chinese Face Reading (Ma Yi Shen Xiang)",
    provider: {
      "@type": "Organization",
      "@id": "https://destini.app/#organization",
      name: "Destini",
    },
    areaServed: "Worldwide",
    description:
      "Personalized Chinese physiognomy interpretation based on a front-facing portrait.",
    url: "https://destini.app/physiognomy",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 背景图层：纯羊皮纸底色（不透明）+ 轻微纹理径向晕染 */}
      <div className="fixed inset-0 z-0 parchment-bg" />


      {/* 顶部导航：全宽铺满视口，背景自适应 */}
      <PhysiognomyTopNav />

      {/* 内容层 */}
      <div className="relative z-10 min-h-screen w-full max-w-md mx-auto flex flex-col">
        <main className="flex-grow px-4 pb-10">
          <PhysiognomyHero />

          <div className="flex flex-col gap-6">
            <UploadCard />
            <InsightsCard />
            <AnalysisCta />
          </div>
        </main>
      </div>
    </>
  );
}
