# Thinking

An organic "working" indicator: three liquid droplets merging and splitting on the engine's surface-tension cycle. A preset over [`Droplets`](droplets.md) with `role="status"` for assistive tech. Replaces the goo-based `ThinkingBlob`.

## Props

`Thinking` extends `DropletsProps` minus `count` and `followPointer`.

| Name | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `"Thinking"` | Accessible label announced to screen readers. |
| `size` | `number` | `18` | Drop diameter in px. |
| `spread` | `number` | `44` | Cluster extent in px. |
| `speed` | `number` | `1.2` | Cycle speed multiplier. |
| `material` | `"glass" \| "flat"` | `"glass"` | Rendered material. |
| `intensity` | `number \| "whisper" \| "present"` | `"present"` | Material volume (0-1): scales the specular's brightness. Defaults to `"present"` (0.7), not the surface family's `"whisper"` — Thinking's pre-pack speculars already rendered at `specularPlacement`'s own 0.7 default (nobody overrode it), and `intensity` maps straight through (unlike JellyButton/MorphSurface's `0.4 x volume`), so `"present"` reproduces it exactly. |
| `refraction` | `boolean` | `false` | Edge lensing on glass (SVG displacement inside `backdrop-filter`, Chromium-only; degrades silently to plain glass blur). |
| `shadow` | `boolean` | `true` | Drop shadow under the surface. |

## Usage

```tsx
import { Thinking } from "fluidkit";

{isWorking && <Thinking label="Generating" />}
```

## Degrades to

Reduced motion / off-screen: three static dots, no animation loop. The status role and label stay intact either way.
