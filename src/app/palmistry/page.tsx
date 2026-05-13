import type { Metadata } from "next";
import { PalmistryTopNav } from "@/components/palmistry/PalmistryTopNav";
import { PalmistryHero } from "@/components/palmistry/PalmistryHero";
import { PalmUploadCard } from "@/components/palmistry/PalmUploadCard";
import { PalmInsightsCard } from "@/components/palmistry/PalmInsightsCard";
import { PalmAnalysisCta } from "@/components/palmistry/PalmAnalysisCta";

export const metadata: Metadata = {
  title: "Palmistry Reading — 手相 Palm Reading",
  description:
    "Upload a photo of your open palm and reveal the four canonical lines — Heart, Head, Life and Fate — each traced and interpreted in the tradition of Chinese palmistry.",
  alternates: { canonical: "/palmistry" },
  openGraph: {
    title: "Palmistry Reading · Destini",
    description:
      "An ink-and-parchment ritual interface for Chinese palmistry, tracing the four lines of the hand.",
    url: "/palmistry",
    type: "website",
  },
};

export default function PalmistryPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Palmistry Reading",
    serviceType: "Chinese Palm Reading",
    provider: {
      "@type": "Organization",
      "@id": "https://destini.app/#organization",
      name: "Destini",
    },
    areaServed: "Worldwide",
    description:
      "Personalized Chinese palmistry interpretation based on a photo of your open palm.",
    url: "https://destini.app/palmistry",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 背景图层：纯羊皮纸底色（不透明）+ 轻微纹理径向晕染 */}
      <div className="fixed inset-0 z-0 parchment-bg" />

      <PalmistryTopNav />

      <div className="relative z-10 min-h-screen w-full max-w-md mx-auto flex flex-col">
        <main className="flex-grow px-4 pb-10">
          <PalmistryHero />

          <div className="flex flex-col gap-6">
            <PalmUploadCard />
            <PalmInsightsCard />
            <PalmAnalysisCta />
          </div>
        </main>
      </div>
    </>
  );
}
