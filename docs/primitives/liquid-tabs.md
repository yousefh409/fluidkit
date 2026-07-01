# LiquidTabs

A tab strip whose active-tab indicator glides between tabs and stretches like mercury as it moves.

## Layering

Tab labels must never live inside a goo-filtered element (CSS `filter` rasterizes an element's entire subtree, blurring any text inside it). `LiquidTabs` renders two overlaid but sibling layers inside an unfiltered container:

1. **Indicator layer**: absolutely positioned, `pointer-events: none`, carries the goo filter. Contains only the moving pill, never text.
2. **Buttons layer**: the `role="tab"` buttons with their labels, on top, fully interactive, no filter.

The indicator's position is measured (`offsetLeft` / `offsetWidth` of the active button) in a layout effect and animated to, rather than riding along via `layoutId`, since the two layers are siblings.

## Props

`LiquidTabs` extends `HTMLAttributes<HTMLDivElement>` (minus `onChange`, which is redefined below). Renders with `role="tablist"`.

| Name | Type | Default | Description |
|---|---|---|---|
| `items` | `{ id: string; label: ReactNode }[]` | required | The tabs to render. |
| `value` | `string` | required | Id of the currently active item. |
| `onChange` | `(id: string) => void` | required | Called when a tab is clicked. |
| `color` | `string` | `currentColor` | Indicator color. |
| `className` | `string` | `undefined` | Applied to the container. |
| `style` | `CSSProperties` | `undefined` | Applied to the container. |

## Usage

```tsx
import { useState } from "react";
import { LiquidTabs } from "fluidkit";

function Tabs() {
  const [value, setValue] = useState("recent");

  return (
    <LiquidTabs
      items={[
        { id: "recent", label: "Recent" },
        { id: "starred", label: "Starred" },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}
```

## Degrades to

Under `prefers-reduced-motion`, the goo filter is dropped and the indicator's transition duration is zeroed, so the pill snaps instantly to the active tab instead of gliding and stretching. Because the labels live on their own unfiltered layer at all times, they stay crisp in every state: the goo effect only ever touches the indicator.
