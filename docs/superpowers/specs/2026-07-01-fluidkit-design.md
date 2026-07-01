# fluidkit — Design Spec (v0.1)

Status: approved for planning · Date: 2026-07-01

## What it is

A React library of **fluid / liquid UI animations** — gooey metaballs, liquid glass,
morph-without-text-warp, thinking blobs, liquid tabs, ripples — built **on top of Motion**.
It supplies the organic *material and motion* layer that general animation engines don't ship,
and degrades cleanly everywhere.

Package name: **`fluidkit`** (verified available on npm). Standalone, open-source, zero coupling
to any app or design system. Flowlet will be its first consumer but the library knows nothing
about it.

## The one non-negotiable principle

**Animate the surface, never the text.** Every morph separates a **surface layer** (shape / glass /
blob — free to scale, stretch, merge) from a **content layer** (text / controls — only cross-fades
or translates a few px, never scales). We use Motion's `layout` / `layoutId` (animates real layout
boxes → text reflows crisp) rather than snapshot-scaling. This is the core value proposition.

## Foundation & decisions (locked)

- Built **on top of Motion**. Motion is a `peerDependency` (consumers bring one shared copy).
  We do not reinvent springs, physics, layout, or FLIP — that is Motion's job.
- Dependency posture: `react`, `react-dom`, `motion` are **peer deps**;
  **`@samasante/liquid-glass` is a regular (bundled) dependency** since LiquidGlass wraps it as the
  refraction engine. Future shader-tier deps (v1.0) will be **optional** peers via `peerDependenciesMeta`.
- **React components + hooks.** React-first. A framework-agnostic core is explicitly out of scope for now.
- **TypeScript**, tree-shakeable **ESM + CJS**, **SSR-safe**, single package.
- Theming-agnostic: behavior/colors/size via props **and** `--fluidkit-*` CSS custom properties.
  No brand shipped. Colors default to `currentColor` where sensible.
- **`prefers-reduced-motion`** collapses every effect to a clean fade / static state. Non-negotiable.
- **Graceful degradation** via feature detection; never hard-fail.

## Architecture

- **Shared SVG `<defs>` — auto-injected singleton.** The goo (`feGaussianBlur` + `feColorMatrix`)
  and lens filters are mounted once into the DOM by the first primitive that needs them. The
  injector is idempotent, ref-counted, and SSR-guarded (DOM touched only in effects, never at
  import). Consumers write nothing; `<Metaballs />` just works. No `<FluidDefs>` provider in v0.1
  (may add later if custom-filter control is requested).
- **Degradation ladder** via small feature-detect utils: `document.startViewTransition`,
  `CSS.supports('backdrop-filter', …)`, Chromium displacement refraction, WebGL context (later).
  Each primitive picks its best available path and falls back per its spec.
- **Reduced motion** resolved once (Motion's `useReducedMotion`) and honored by every primitive.
- **Off-screen pause**: looping primitives (Metaballs, ThinkingBlob) pause via IntersectionObserver.
- **Tree-shaking**: named exports from a single entry; `sideEffects` limited so importing one
  primitive never drags in another (and never the future shader tier).

### Internal structure

```
src/
  components/   MorphSurface, Metaballs, ThinkingBlob, LiquidGlass, FlowStagger, LiquidTabs, Ripple
  hooks/        useMorph, useGoo, useFlow, useRipple
  filters/      goo + lens <defs>, singleton injector
  utils/        featureDetect, reducedMotion, color, useInView
  index.ts      re-exports everything
```

Tooling: `tsup` → ESM + CJS + types. Vitest + Testing Library. A Vite playground that mirrors the
prototype demos, plus one docs page per primitive.

## v0.1 public API

Signatures are the design contract (not implementation). Props listed are the intended surface;
exact spring defaults tuned during build against the prototypes.

### `<MorphSurface>` + `useMorph()` — flagship

Persistent surface + slots, driven by an `open` / state prop. The Surface layer layout-animates
size/shape; the Content layer only cross-fades. `useMorph()` is the headless escape hatch returning
props to spread onto your own surface + content nodes.

- Props: `open`, `surface` (className/style for the morphing shape), `children` (content that
  cross-fades on change), `transition?` (Motion spring override), `as?`, `onMorphComplete?`.
- Degrades to: instant swap + fade under reduced motion.

### `<Metaballs>` + `useGoo()`

Same-color, borderless blobs that orbit and fuse like mercury via the goo filter.
`useGoo()` returns props to apply the goo filter to *your own* container so your children fuse.

- `<Metaballs>` props: `count`, `color`, `size`, `spread`, `speed`, `seed?`, `className`, `style`.
- Degrades to: separate circles (filter off).

### `<ThinkingBlob>`

Organic "working" indicator — three blobs merge/split on a loop. Shares the goo filter.

- Props: `color`, `size`, `speed`, `active`.
- Degrades to: 3-dot pulse.

### `<LiquidGlass>`

Frosted glass panel with **real refraction**. Wraps **`@samasante/liquid-glass`** (zero-dep,
React 18+, SVG signed-distance-field lens) as the refraction engine. Our own frosted-blur
(`backdrop-filter: blur()`) is the **degradation layer** underneath: used for non-Chromium,
reduced-motion, and SSR, or when the engine can't run.

- Props: `blur`, `refraction` (`'auto' | boolean`), `radius`, `tint`, `className`, `style`, `children`.
- Degrades to: plain frosted blur → solid tint (when `backdrop-filter` unsupported). Never hard-fails.
- Note: `@samasante` is ESM-only; the CJS build keeps it external / dynamically imported.

### `<FlowStagger>` + `useFlow()`

Children rise + un-blur + settle, staggered; siblings glide to new positions (Motion `layout`) on
add / remove / reorder. `useFlow()` exposes the per-child variants/props for custom layouts.

- Props: `stagger`, `children`, `transition?`.
- Degrades to: simple fade.

### `<LiquidTabs>`

Active-tab indicator that stretches and gooeys between items like a mercury underline (Motion
`layout` for indicator position + goo filter for the stretch).

- Props: `items` (or `children`), `value`, `onChange`, `color`, `className`.
- Degrades to: a plain sliding underline (goo off) → instant move under reduced motion.

### `<Ripple>` + `useRipple()`

Pointer-origin water ripple on tap/click. `<Ripple>` wraps a surface and adds the ripple overlay;
`useRipple()` returns handlers + the ripple layer for custom surfaces.

- Props: `color`, `duration`, `children`, `className`.
- Degrades to: no ripple (or a subtle opacity flash) under reduced motion.

## Roadmap (full catalog)

- **v0.1 — Core (this spec):** MorphSurface/useMorph, Metaballs/useGoo, ThinkingBlob, LiquidGlass,
  FlowStagger/useFlow, LiquidTabs, Ripple. All CSS/SVG/Motion, dependency-light. Docs page per primitive.
- **v0.5 — Interaction & ambient:** JellyButton/useSquish, Magnetic, LiquidDrag, DripFuse,
  MeshGradient, Aurora. Examples site, bundle-size budget + CI.
- **v1.0 — GPU/shader tier (isolated, optional peer deps):** LiquidMetal (Paper Shaders),
  WaterField (WebGL fluid sim). Stable API, a11y pass, SSR verified, published to npm.

## Testing strategy

- **TDD the pure logic first:** feature-detect utils, color parsing, defs-injector idempotency +
  ref-counting, reduced-motion resolution.
- **Render tests** per component, including the degradation paths and SSR-no-window path.
- **Visual truth** = render in a browser (Playwright/Chrome) + screenshot, compared against the
  matching prototype in `prototypes/`.

## Non-goals

- No custom spring/physics/layout engine (Motion's job).
- No coupling to Flowlet or any design system / brand.
- Not a component kit (buttons, inputs) — only the fluid-animation layer.
- No Safari/Firefox parity chase for refraction; ship Chromium-enhanced + graceful fallback.
