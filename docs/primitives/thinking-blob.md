# ThinkingBlob

An organic "working" indicator: three same-color blobs that merge and split on a loop via the shared goo filter, read as ambient activity rather than a literal progress signal.

## Props

`ThinkingBlob` extends `HTMLAttributes<HTMLDivElement>`, so any standard div attribute passes through. It renders with `role="status"` and `aria-label="Thinking"` by default (override via `aria-label`).

| Name | Type | Default | Description |
|---|---|---|---|
| `color` | `string` | `currentColor` | Blob color. |
| `size` | `number` | `20` | Blob diameter in px. |
| `speed` | `number` | `1` | Animation speed multiplier (higher = faster, shorter loop duration). |
| `active` | `boolean` | `true` | When `false`, renders static with no looping animation. |
| `className` | `string` | `undefined` | Applied to the container. |
| `style` | `CSSProperties` | `undefined` | Applied to the container. |

## Usage

```tsx
import { ThinkingBlob } from "fluidkit";

function AssistantStatus({ isWorking }: { isWorking: boolean }) {
  return <ThinkingBlob active={isWorking} color="#5b8def" />;
}
```

There is no separate headless hook for `ThinkingBlob`; it composes `useGoo()` internally. Use `useGoo()` directly if you need the merge/split fusion on your own custom shapes.

## Degrades to

Under `prefers-reduced-motion`, the goo merge/split motion is replaced by a calm 3-dot indicator: no fusion, no transform/scale movement, just a gentle opacity-only pulse (or fully static if `active` is `false`). Also pauses when scrolled off-screen.
