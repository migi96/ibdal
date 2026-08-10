# إبداع الفكر — Next.js landing

Arabic RTL marketing landing for Ibdal Al-Fakr Consulting, built from the Figma
deck (`goD0GjqeBMsiFsZ1mA4Hw1`) with GSAP + ScrollTrigger parallax and three.js
canvas animations.

```bash
npm run dev    # develop
npm run build  # static production build
npm run start  # serve production build
```

## Architecture

- **Next.js 16 App Router + TypeScript.** Sections are Server Components
  wherever possible; `"use client"` only on interactive islands and sections
  with custom scroll choreography (Hero, Services, Methodology, Header).
- **Content** is copied verbatim from the deck implementation in `../site/slides/`
  (the single source of truth for Arabic copy); assets live in `public/assets/`.
- **Fonts**: Alexandria via `next/font/google` (`--font-alexandria`, swap).
- **Design tokens**: `app/globals.css` (palette, type scale, easings) — CSS
  Modules per component/section consume them.

## Motion system (`lib/motion/gsap.ts`)

Single GSAP registration point exporting `gsap`, `ScrollTrigger`, `useGSAP`,
plus two shared matchMedia gates:

- `MOTION_OK` — `prefers-reduced-motion: no-preference`. Every animation lives
  inside this gate; reduced-motion users get a fully static page.
- `DESKTOP_POINTER` — `(hover:hover) and (pointer:fine) and (min-width:1024px)`.
  Pointer effects (magnetic buttons, tilt, per-letter hover, the pinned
  horizontal Services gallery) run only here. Services mirrors the same
  condition in a CSS media query so layout and pinning can never disagree.

Reusable islands (`components/motion/`): `Parallax` (scrub-tied, transform
only), `Reveal`, `Counter` (writes textContent, no re-renders), `MagneticButton`
and `TiltCard` (`gsap.quickTo` — zero allocation in pointer handlers), `Marquee`
(pure CSS, compositor-only). `GsapProvider` refreshes ScrollTrigger after font
load. Rules everywhere: transform/opacity only, `once: true` entrances,
function-based distances with `invalidateOnRefresh`.

## Typography (`components/typography/HoverTitle`)

Per-letter hover with an Arabic-safety nuance: Arabic is cursive, so letters
are never split into spans (that breaks shaping). Latin words get true
per-letter spans; Arabic words stay intact and a cursor-tracked radial
gradient — clipped to the glyphs via `background-clip: text` — lights letters
under the pointer. Each word/letter re-clips the inherited title gradient
itself: Chrome does not paint an ancestor's clipped background through
transformed descendants (see the comment in `HoverTitle.module.css`).

## three.js / canvas effects (`lib/fx/`, `components/three/FxCanvas`)

The four deck animations (particle sphere, self-drawing loop, docking tiles,
stream lines) are vendored IIFEs sharing window globals, so `lib/fx/loader.ts`
serializes their imports and captures each API before the next overwrites it.
`three` is pinned to 0.136 (the API the modules target). `FxCanvas`:

- loads nothing (three.js included) until the canvas is within 30% of the
  viewport (IntersectionObserver);
- the vendor modules cap DPR at 2 and self-pause offscreen / hidden-tab;
- reduced-motion users get the static artwork via `fallbackSrc`.

Effect placement: hero → `latentField`; Juman AI learning card → `selfDraw`;
Juman AI architecture → `dockingField`; contact CTA → `streamWave`
(`transparent: true` — a local patch that skips its paper backdrop).

## Performance guarantees

Static prerender (no server work), all animation transform/opacity-only, no
layout reads in hot paths, canvases lazy + self-pausing, marquee/scroll-cue on
the compositor, images via `next/image` below the fold, fonts self-hosted by
`next/font`. Verified headless: zero console errors, zero failed requests,
zero horizontal overflow at 390px.
