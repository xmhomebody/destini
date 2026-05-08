import type { MetadataRoute } from "next";

// 站点公开 URL：与 layout.tsx 保持一致
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destini.app";

/**
 * Destini sitemap
 * 当前仅有首页可被爬取；后续模块上线时按需追加
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 已规划但暂未上线的模块入口：保留在数组中以便上线时直接放开
  const modules = [
    "physiognomy",
    "bazi",
    "naming",
    "liuyao",
    "healing",
  ] as const;

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${siteUrl}/`,
          "zh-CN": `${siteUrl}/zh`,
        },
      },
    },
    ...modules.map((slug) => ({
      url: `${siteUrl}/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
