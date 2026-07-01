# MorphSurface

The flagship primitive. A persistent surface (shape / glass / blob) morphs its size and shape while its content cross-fades, so text never scales or stretches.

## Core principle

`MorphSurface` structurally enforces fluidkit's one non-negotiable rule: **animate the surface, never the text.** The surface and content are always rendered as separate siblings. The surface is a `motion.[tag]` driven by Motion's `layout` (real layout-box tweening, no snapshot scaling). The content sits in its own wrapper and only cross-fades (opacity + a few px of translate) via `AnimatePresence`. Because content is never a descendant of the surface, nothing that resizes the surface's box can ever touch a glyph.

You control the surface's open/closed geometry yourself via CSS, keyed off the `data-open` attribute the surface carries (e.g. `.glass[data-open="true"] { width: 320px; }`).

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | required | Current open/closed state. Drives the surface's `data-open` attribute and which content is shown. |
| `surface` | `{ className?: string; style?: CSSProperties }` | `undefined` | Applied to the surface element (the shape/glass/blob layer). |
| `children` | `ReactNode` | required | The content layer, swapped/cross-faded whenever `open` changes. Never scaled. |
| `transition` | `Transition` (Motion) | spring, `stiffness: 400, damping: 40` | Overrides both the surface's layout tween and the content cross-fade. |
| `as` | `keyof JSX.IntrinsicElements` | `"div"` | Element tag for the surface. |
| `onMorphComplete` | `() => void` | `undefined` | Called when the surface's layout animation finishes. |
| `className` | `string` | `undefined` | Applied to the outer wrapper. |
| `style` | `CSSProperties` | `undefined` | Applied to the outer wrapper. |

## Usage

```tsx
import { useState } from "react";
import { MorphSurface } from "fluidkit";

function Assistant() {
  const [open, setOpen] = useState(false);

  return (
    <MorphSurface open={open} surface={{ className: "assistant-surface" }}>
      {open ? (
        <div onClick={() => setOpen(false)}>Full panel content</div>
      ) : (
        <div onClick={() => setOpen(true)}>Ask fluidkit</div>
      )}
    </MorphSurface>
  );
}
```

```css
.assistant-surface {
  width: 160px;
  height: 40px;
  border-radius: 20px;
}
.assistant-surface[data-open="true"] {
  width: 320px;
  height: 240px;
  border-radius: 16px;
}
```

## Headless escape hatch: `useMorph()`

For a custom surface/content structure, use `useMorph({ open, transition?, onMorphComplete? })` directly. It returns:

- `surfaceProps`: spread onto your own `motion.[tag]` surface (`layout`, `transition`, `data-open`, `onLayoutAnimationComplete`).
- `contentProps`: spread onto your own `motion.div` content, inside your own `AnimatePresence` (`key`, `initial`, `animate`, `exit`, `transition`).
- `prefersReducedMotion`: the resolved boolean, if you want to branch yourself.

## Degrades to

Under `prefers-reduced-motion`, the surface snaps instead of tweening its layout, and the content cross-fade drops to opacity-only (no translate). No JavaScript animation runs; state changes are instant swaps with a plain fade.
