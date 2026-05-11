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
