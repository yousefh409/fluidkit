# LiquidBadge

A notification badge that **absorbs its increments**: when `count` goes up, a
small droplet appears beside the badge and merges into its body through a
real metaball bridge (the Droplets recipe at badge scale), draining in as the
number cross-fades. The text itself never scales or travels — only the liquid
moves. Decrements just cross-fade.

## Usage

```tsx
import { LiquidBadge } from "fluidkit";

// pinned to an anchor
<button aria-label={`Inbox, ${unread} unread`}>
  <LiquidBadge count={unread} max={99}>
    <InboxIcon />
  </LiquidBadge>
</button>

// standalone
<LiquidBadge count={3} />
```

## Props

| Prop | Type | Default | What it does |
|---|---|---|---|
| `count` | `number` | required | The count. `0` hides the badge unless `showZero`. |
| `max` | `number` | `99` | Counts above render as `${max}+`. |
| `showZero` | `boolean` | `false` | Keep the badge visible at zero. |
| `children` | `ReactNode` | — | The anchor the badge pins to (top-right); omit for standalone. |

Plus the surface style pack (`material`, `tint` — defaults to a quiet red —
`color`, `intensity` — defaults `"present"` — `light`, `reflection`,
`shadow`).

## Accessibility

The badge is decorative (`aria-hidden`): the absorb animation is visual
garnish, not information. Put the real count in accessible text — e.g. the
anchor's `aria-label` — where screen readers announce it on their own terms.

## Degrades to

- **Reduced motion:** the count cross-fades; no droplet, no loop.
