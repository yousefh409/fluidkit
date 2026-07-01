# FlowStagger

A list of children rise, un-blur, and settle in a staggered sequence. Because every item carries Motion's `layout`, siblings glide (FLIP) to their new positions whenever the list is added to, removed from, or reordered.

## Props

`FlowStagger` extends `HTMLAttributes<HTMLDivElement>` (minus the Motion-conflicting drag/animation event handlers, which `motion.div` redefines with gesture-aware signatures).

| Name | Type | Default | Description |
|---|---|---|---|
| `stagger` | `number` | `0.06` | Seconds between each child's animation start. |
| `transition` | `Transition` (Motion) | `{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }` | Overrides each item's rise/settle tween. |
| `children` | `ReactNode` | required | The list items. Each is wrapped individually and keyed off its own `key` for identity across reorders. |
| `className` | `string` | `undefined` | Applied to the container. |
| `style` | `CSSProperties` | `undefined` | Applied to the container. |

## Usage

```tsx
import { FlowStagger } from "fluidkit";

function MessageList({ messages }: { messages: string[] }) {
  return (
    <FlowStagger stagger={0.08}>
      {messages.map((m, i) => (
        <div key={i}>{m}</div>
      ))}
    </FlowStagger>
  );
}
```

## Headless escape hatch: `useFlow()`

`useFlow({ stagger?, transition? })` returns:

- `containerProps`: spread onto your own `motion.[tag]` list wrapper (`initial`, `animate`, `variants` with `staggerChildren`).
- `itemProps`: spread onto each child's own `motion.div` wrapper (`layout`, `variants` for the hidden/visible rise).
- `prefersReducedMotion`: the resolved boolean.

## Degrades to

Under `prefers-reduced-motion`, item variants collapse to opacity-only (no rise, no blur), the stagger delay drops to `0`, and layout tweening is disabled. The whole list reads as a simple, simultaneous fade.
