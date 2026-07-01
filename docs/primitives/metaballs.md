# Metaballs

Same-color, borderless blobs that orbit and fuse like mercury via the shared goo SVG filter.

Per-blob drift is derived deterministically from each blob's index (and an optional `seed`) using trig, not `Math.random()`, so renders are reproducible and multiple instances on a page can still look distinct.

## Props

`Metaballs` extends `HTMLAttributes<HTMLDivElement>`, so any standard div attribute (e.g. `id`, `aria-*`) passes through.

| Name | Type | Default | Description |
|---|---|---|---|
| `count` | `number` | `3` | Number of blobs. |
| `color` | `string` | `currentColor` | Blob color. |
| `size` | `number` | `60` | Blob diameter in px. |
| `spread` | `number` | `80` | Px range the blobs drift across. |
| `speed` | `number` | `1` | Animation speed multiplier (higher = faster). |
| `seed` | `number` | `0` | Deterministic per-instance offset so multiple instances differ. |
| `className` | `string` | `undefined` | Applied to the container. |
| `style` | `CSSProperties` | `undefined` | Applied to the container. |

## Usage

```tsx
import { Metaballs } from "fluidkit";

function Loader() {
  return <Metaballs count={4} color="#5b8def" size={48} spread={70} />;
}
```

## Headless escape hatch: `useGoo()`

`useGoo()` takes no arguments and returns `{ style }`. Spread that `style` onto your own container so its children fuse via the goo filter (`Metaballs` is built on top of this). It mounts the shared `fluidkit-goo` SVG filter defs on first use.

## Degrades to

Under `prefers-reduced-motion`, the goo filter is dropped and blobs render as separate, static circles (no drift, no fusing). Blobs also pause automatically when scrolled off-screen (via `IntersectionObserver`), independent of reduced motion.
