# fluidkit

A React library of fluid / liquid UI animations: gooey metaballs, liquid glass, morphing surfaces, thinking blobs, liquid tabs, ripples. Built on top of [Motion](https://motion.dev).

## The core principle

**Animate the surface, never the text.** Every morph separates a surface layer (shape / glass / blob, free to scale, stretch, or merge) from a content layer (text / controls, which only cross-fades or translates a few px, never scales). fluidkit uses Motion's `layout` / `layoutId` to animate real layout boxes, not snapshot scaling, so text always reflows crisp.

## Install

```bash
npm install fluidkit react react-dom motion
```

`react`, `react-dom`, and `motion` are peer dependencies (bring your own shared copy). `@samasante/liquid-glass` comes bundled as a regular dependency, used internally by `LiquidGlass` as its refraction engine.

## Quick start

```tsx
import { useState } from "react";
import { MorphSurface, Ripple } from "fluidkit";

function App() {
  const [open, setOpen] = useState(false);

  return (
    <Ripple className="card">
      <MorphSurface open={open} surface={{ className: "surface" }}>
        {open ? <FullPanel /> : <button onClick={() => setOpen(true)}>Open</button>}
      </MorphSurface>
    </Ripple>
  );
}
```

## Primitives (v0.1)

| Primitive | What it does | Degrades to |
|---|---|---|
| [`MorphSurface`](docs/primitives/morph-surface.md) | Persistent surface + content that morphs open/closed without scaling text | Instant swap + opacity-only fade |
| [`Metaballs`](docs/primitives/metaballs.md) | Same-color blobs that orbit and fuse via a goo filter | Separate static circles (filter off) |
| [`ThinkingBlob`](docs/primitives/thinking-blob.md) | Organic "working" indicator, three blobs merging/splitting | Calm 3-dot opacity pulse |
| [`LiquidGlass`](docs/primitives/liquid-glass.md) | Frosted glass panel with real refraction | Refraction → frosted blur → solid tint |
| [`FlowStagger`](docs/primitives/flow-stagger.md) | Staggered rise + un-blur entrance for list items, FLIP on reorder | Simple simultaneous fade |
| [`LiquidTabs`](docs/primitives/liquid-tabs.md) | Tab indicator that glides and stretches like mercury | Plain sliding pill, snaps instantly |
| [`Ripple`](docs/primitives/ripple.md) | Pointer-origin water ripple on tap/click | No ripple, children render normally |

Each component pairs with a headless hook (`useMorph`, `useGoo`, `useFlow`, `useRipple`) for consumers who want the behavior on their own markup. See each primitive's doc for its exact return shape.

## Cross-cutting guarantees

- **Reduced motion**: `prefers-reduced-motion` is resolved once and honored by every primitive, collapsing effects to a clean fade or static state.
- **SSR-safe**: nothing touches `window` or the DOM at import time or during render; feature detection and defs-injection are guarded and run in effects only.
- **Tree-shakeable**: named exports from a single entry point (`sideEffects: false`), so importing one primitive never drags in another.
- **Theming**: behavior, colors, and size are set via props and `--fluidkit-*` CSS custom properties. No brand is shipped; colors default to `currentColor` where sensible.
- **Graceful degradation**: every primitive picks its best available path via feature detection and never hard-fails.

## Roadmap

- **v0.1 (Core, this release)**: MorphSurface/useMorph, Metaballs/useGoo, ThinkingBlob, LiquidGlass, FlowStagger/useFlow, LiquidTabs, Ripple/useRipple.
- **v0.5 (Interaction & ambient)**: JellyButton/useSquish, Magnetic, LiquidDrag, DripFuse, MeshGradient, Aurora.
- **v1.0 (GPU/shader tier)**: LiquidMetal (Paper Shaders), WaterField (WebGL fluid sim), as isolated optional peer deps.

## More

- Design spec: [`docs/superpowers/specs/2026-07-01-fluidkit-design.md`](docs/superpowers/specs/2026-07-01-fluidkit-design.md)
- Playground: `npm run dev`

## License

MIT
