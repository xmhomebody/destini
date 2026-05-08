import { TopNav } from "@/components/home/TopNav";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { HomeCta } from "@/components/home/HomeCta";
import { HomeFooter } from "@/components/home/HomeFooter";

/**
 * Destini 首页
 * 视觉参考：Stitch Astrology / Index 屏幕（Ancient Physiognomy System）
 * 移动端优先，桌面端居中收窄至 max-w-md，模拟卷轴的中轴对称
 */
export default function Home() {
  // JSON-LD 结构化数据：声明 WebSite + Organization，便于搜索引擎建立品牌实体
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
      <div className="min-h-screen w-full max-w-md mx-auto overflow-x-hidden relative flex flex-col">
        <TopNav />
        <Hero />
        <Services />
        <HomeCta />
        <HomeFooter />
      </div>
    </>
  );
}
