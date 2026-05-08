import Image from "next/image";
import { TopNav } from "@/components/home/TopNav";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { HomeCta } from "@/components/home/HomeCta";
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
        {/* 半透明羊皮纸遮罩：底部加深保证文字可读性 */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(240,232,218,0.30) 0%, rgba(240,232,218,0.50) 60%, rgba(240,232,218,0.78) 100%)",
          }}
        />
      </div>

      {/* 内容层：z-10 浮于背景图之上，居中收窄 */}
      <div className="relative z-10 min-h-screen w-full max-w-md mx-auto flex flex-col">
        <TopNav />
        <Hero />
        <Services />
        <HomeCta />
        <HomeFooter />
      </div>
    </>
  );
}
