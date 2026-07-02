/** Placeholder — Task 3 replaces this with the real `webgl-fluid-enhanced` wrapper. */

import type { HTMLAttributes } from "react";

export interface WaterFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Fluid palette. */
  colors?: string[];
  /** Whether the field responds to pointer input. */
  interactive?: boolean;
}

export function WaterField(_props: WaterFieldProps): never {
  throw new Error("fluidkit/water-field: not yet implemented");
}
