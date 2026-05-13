# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (port 3000)
npm run build    # production build
npm run lint     # ESLint (eslint-config-next/core-web-vitals + typescript)
```

No test suite is configured yet.

## Stack

- **Next.js 16** (App Router) with **React 19** — read `node_modules/next/dist/docs/` before writing Next.js-specific code; APIs may differ from older versions
- **TypeScript** (strict mode), path alias `@/*` → `src/*`
- **Tailwind CSS v4** — configured entirely via CSS (`src/app/globals.css`); no `tailwind.config.*` file
- **shadcn/ui** (`style: base-nova`) — add components with `npx shadcn add <component>`; they land in `src/components/ui/`
- **PWA** — `public/manifest.webmanifest` + icon set; `next.config.ts` allows LAN dev origins for mobile testing

## Project purpose

Destini is a Chinese metaphysics / divination app (I Ching, Physiognomy, BaZi, Naming, Liu Yao, Healing). The visual language is deliberately ritual / ancient: parchment tones, cinnabar red, gold accents, ink typography.

## Architecture

### Layout pattern (every page)

Pages layer two `z`-stacked regions:

1. **`fixed inset-0 z-0`** — full-viewport background: `next/image` (the ink-wash landscape) + a parchment gradient overlay applied inline via `style={}`. The gradient opacity varies per page (lighter on home, heavier on sub-pages).
2. **`relative z-10 min-h-screen w-full max-w-md mx-auto flex flex-col`** — mobile-first content column (max 448 px, centered).

`RootLayout` (`src/app/layout.tsx`) sets `body` to `bg-transparent` so the fixed background layer shows through.

### Routes

| Route | Page file | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Home: TopNav → Hero → Services grid → CTA → Footer |
| `/physiognomy` | `src/app/physiognomy/page.tsx` | Face-reading upload & analysis UI |
| `/bazi`, `/naming`, `/liuyao`, `/healing` | not yet created | Planned service pages |

SEO infrastructure is fully wired: `robots.ts`, `sitemap.ts`, per-page `metadata` exports, and JSON-LD structured data injected inline in each page.

### Component organization

```
src/components/
  home/          # page-scoped: TopNav, Hero, Services, ServiceCard, ServiceIcons, HomeCta, HomeFooter
  physiognomy/   # page-scoped: PhysiognomyTopNav, PhysiognomyHero, UploadCard, InsightsCard, AnalysisCta
  ui/            # shadcn primitives (button, …)
src/lib/
  utils.ts       # cn() helper (clsx + tailwind-merge)
```

### Design tokens

All design tokens live in `src/app/globals.css` under `:root` and `@theme inline`. Key custom tokens:

| Token | Value | Use |
|---|---|---|
| `--color-parchment` | `#f0e8da` | primary background |
| `--color-cinnabar` | `#9a2a1b` | primary accent / CTA |
| `--color-gold` | `#c2a878` | borders, ornaments |
| `--color-ink-dark` | `#4a3525` | body text |
| `--font-display` | `--font-cinzel` | headings / brand |
| `--font-serif` | `--font-playfair` | body / editorial |

Utility CSS classes for repeated ritual motifs: `.ornate-card` (double-rule gold border card), `.seal-stamp` (vertical cinnabar seal), `.btn-cinnabar` (gradient red CTA button), `.parchment-bg` (textured parchment background).

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (defaults to `https://destini.app`) |

## Behavioral Guidelines

**核心原则：谨慎优先于速度。**

### 1. 先思考再编码
- 明确陈述假设；有疑问先问，不要默默猜测。
- 存在多种解读时，列出选项供用户决策。
- 发现更简单的方案时主动说明；遇到不清楚的地方停下来提问。

### 2. 简洁优先
- 只写解决问题所需的最少代码，不加任何推测性功能。
- 单次使用的代码不做抽象；不添加未被要求的"灵活性"或"可配置性"。
- 自问："资深工程师会觉得这过于复杂吗？" 若是，则简化。

### 3. 外科式修改
- 只改必须改的部分，不"顺手优化"无关代码。
- 保持现有风格，即使你有不同偏好。
- 自己的改动造成的孤立代码（未使用的 import/变量/函数）要清理；已有的死代码不主动删除，发现时告知用户。

### 4. 目标驱动执行
- 将任务转化为可验证的成功标准，再开始实现。
- 多步骤任务先列简短计划（步骤 → 验收条件），执行后逐项确认。
