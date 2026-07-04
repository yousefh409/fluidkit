# Caustics — design

Date: 2026-07-04
Status: approved (pending spec review)

## What it is

`Caustics` is a new ambient background component: warm caustic light — the webbed
patterns sunlight makes when it passes through water — drifting slowly across a
plaster-toned surface. "Poolside light."

It joins `Silk`, `MeshGradient`, and `GlassPanes` in the backgrounds family and uses the
same usage contract: the component IS the background layer (`position: absolute; inset: 0;
pointer-events: none`), placed inside a `position: relative` parent alongside the
consumer's content.

## How we got here

Judged live across five prototype rounds (water lab). Decisions locked along the way:

- Water direction narrowed to ambient caustic light ("poolside light"). Interactive
  water (fluid cursor drag + water-glass card) was prototyped through a real
  Navier–Stokes pass and **dropped for now** — prototypes preserved in the lab for a
  future revisit.
- Look: warm, quiet, light-mode; light as a material, not blue paint. Low amplitude,
  slow drift, light concentrated in a soft diagonal sunbeam band.
- Engine: **WebGL**, chosen over a CSS/SVG twin built for a side-by-side face-off.
  The deciding difference: shader light continuously *reforms* (filaments merge and
  split); CSS layers can only drift fixed patterns.

## Public API

```ts
export interface CausticsProps extends HTMLAttributes<HTMLDivElement> {
  /** Light color. Defaults to warm ivory. */
  color?: string;
  /** Wall color: one color or a [top, bottom] pair. Defaults to soft plaster. */
  background?: string | [string, string];
  /** Brightness of the light webs, 0-1. Defaults to 0.5. */
  intensity?: number;
  /** Size of the light pattern; higher = larger webs. Defaults to 1. */
  scale?: number;
  /** Drift rate; 1 is the quiet default rate. */
  speed?: number;
  /** Strength of the diagonal sunbeam the light lives in, 0-1 (0 = uniform light). Defaults to 0.55. */
  band?: number;
}
```

Raw parameters only, no presets (house rule for backgrounds). `className`, `style`, and
remaining div attributes pass through to the root.

## Rendering

- Self-contained WebGL1 canvas: one fullscreen triangle, one fragment shader, small
  runtime (~2–3 kB min+gz budget). No dependencies; Motion is not involved.
- **The shader must be an original clean-room implementation.** The prototype adapted
  the well-known "Tileable Water Caustic" Shadertoy (CC BY-NC-SA) — that code cannot
  ship in an MIT library. Reimplement the look with our own math (iterative
  domain-warped sine accumulation or Voronoi-ridge extraction), tuned by eye against
  the approved prototype.
- Colors arrive as uniforms (parsed once per prop change); `intensity`, `scale`,
  `speed`, `band` are uniforms too — prop changes must not recompile the program.
- Canvas resolution follows element size via `ResizeObserver`, device-pixel-ratio
  capped at 1.5.
- The render loop runs only while visible: `IntersectionObserver` gates rAF;
  browser rAF throttling handles hidden tabs.

## Degradation & lifecycle

- No WebGL / context creation fails / shader compile fails → render the static CSS
  fallback: the plaster gradient plus a soft warm radial tint. Never throw, never
  render a black box.
- `prefers-reduced-motion: reduce` → render exactly one frame, no loop (a frozen
  caustic reads as a texture).
- `webglcontextlost` → prevent default, attempt one restore on `webglcontextrestored`;
  if restore fails, swap to the CSS fallback.
- SSR-safe: no `window`/GL access at module scope or during server render; GL boots in
  an effect after mount.
- Unmount: cancel rAF, disconnect observers, release the GL program/buffers via
  `WEBGL_lose_context` when available.

## Files

- `src/components/Caustics.tsx` — component + shader source string.
- `src/components/index.ts`, `src/index.ts` — exports.
- `tests/components/Caustics.test.tsx` — renders with content visible; jsdom (no
  WebGL) exercises the CSS fallback branch; reduced-motion renders single frame
  (mocked GL); prop passthrough (`className`, `style`, aria); unmount cleans up
  without errors.
- `docs/primitives/caustics.md` — usage + props, matching the other primitive docs.
- `playground/showcase` — registry entry + showcase page with the approved
  poolside-light treatment.
- `CHANGELOG.md` entry; size budget re-pinned in `scripts`.

## Out of scope (explicitly)

- Interactive water: fluid cursor drag, water-glass card, wave/ripple simulation —
  prototyped, parked. If revisited, it is its own spec.
- Dark mode tuning beyond sane defaults (colors are raw props; consumers can pass
  dark-friendly values).
- Framework-agnostic core.
