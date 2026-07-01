# LiquidGlass

A frosted glass panel that, on capable browsers, shows real refraction (content behind it visibly bends) by wrapping the `@samasante/liquid-glass` engine. It never hard-fails: any unsupported capability or a failed engine load just renders a plainer panel.

## Props

`LiquidGlass` extends `HTMLAttributes<HTMLDivElement>`.

| Name | Type | Default | Description |
|---|---|---|---|
| `blur` | `number` | `14` | Frosted blur strength in px (also used as the engine's pre-refraction blur). |
| `refraction` | `"auto" \| boolean` | `"auto"` | `"auto"` picks refraction when supported and motion isn't reduced. `true` opts in explicitly (still falls back if unsupported). `false` always uses the frosted/tint fallback and never loads the engine. |
| `radius` | `number` | `16` | Panel corner radius in px. |
| `tint` | `string \| boolean` | `undefined` | `true` = a more visible translucent default. `false` = no tint wash. A string is resolved as a CSS color. Omitted = a subtle translucent default. |
| `children` | `ReactNode` | `undefined` | Content rendered inside the panel. |
| `className` | `string` | `undefined` | Applied to the panel. |
| `style` | `CSSProperties` | `undefined` | Applied to the panel. |

## Usage

```tsx
import { LiquidGlass } from "fluidkit";

function Panel() {
  return (
    <LiquidGlass blur={16} radius={20} tint="rgba(20, 20, 30, 0.3)">
      <p>Content behind this panel refracts on capable browsers.</p>
    </LiquidGlass>
  );
}
```

## Note: ESM-only engine

`@samasante/liquid-glass` is ESM-only, so it is loaded via a dynamic `import()` inside a `useEffect`, never at module load or during render. The very first render (server or client) always renders the frosted/tint fallback; the engine swaps in on a later re-render once the import resolves. This keeps the engine out of your bundle unless a rendered `LiquidGlass` actually wants refraction.

## Degrades to

Three-rung ladder, picked automatically:

1. **Refraction**: the `@samasante/liquid-glass` engine (Chromium-class browsers, motion not reduced, engine loaded successfully).
2. **Frosted blur**: plain `backdrop-filter: blur()`, used when refraction is unavailable but `backdrop-filter` is supported.
3. **Solid tint**: a flat tinted background, used when `backdrop-filter` itself is unsupported.

`prefers-reduced-motion` always skips the refraction engine (rungs 2–3 only, chosen by `backdrop-filter` support). The panel is always rendered; it never hard-fails.
