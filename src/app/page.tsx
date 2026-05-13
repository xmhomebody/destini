import Image from "next/image";
import { TopNav } from "@/components/home/TopNav";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { HomeFooter } from "@/components/home/HomeFooter";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://destini.app/#website",
        url: "https://destini.app/",
        name: "Destini",
        description:
          "Ancient Insight, Ritual Guidance, Inner Healing — rooted in Chinese I Ching wisdom.",
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": "https://destini.app/#organization",
        name: "Destini",
        url: "https://destini.app/",
        slogan: "Ancient Insight, Ritual Guidance, Inner Healing",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 背景图层：fixed + inset-0 随视口全宽铺满，不受内容宽度限制 */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/img_index_bg.png"
          alt=""
          fill
          priority
          className="object-cover object-top"
          sizes="100vw"
        />
        {/* 八卦图中心高光：径向渐变 + 混合模式，提亮约 30% */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 32%, rgba(255, 230, 150, 0.32) 0%, rgba(255, 220, 120, 0.20) 18%, rgba(255, 200, 80, 0.08) 35%, transparent 55%)",
            mixBlendMode: "screen",
          }}
        />
        {/* 底部黑色渐变：从透明过渡到 70% 不透明黑 */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[42%] pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.25) 45%, rgba(0, 0, 0, 0.55) 80%, rgba(0, 0, 0, 0.70) 100%)",
          }}
        />
      </div>

      {/* 内容层：z-10 浮于背景图之上，居中收窄 */}
      <div className="relative z-10 min-h-screen w-full max-w-md mx-auto flex flex-col">
        <TopNav />
        <Hero />
        <Services />
<HomeFooter />
      </div>
    </>
  );
}
