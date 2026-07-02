/**
 * Liquid materials. A material is a PROP, not a component family: the same
 * engine shape renders as clear glass, mercury, or a flat fill.
 *
 * - glass: white tint + backdrop blur/saturation, lit by the scene light.
 *   Degrades to a frosted flat fill when backdrop-filter is unsupported.
 * - mercury: metallic gradient. No painted highlight — the gradient IS the
 *   reflection.
 * - flat: plain color; also the reduced/fallback rendering.
 */

import type { CSSProperties } from "react";
import { supportsBackdropFilter } from "../utils/featureDetect";

export type LiquidMaterial = "glass" | "mercury" | "flat";

export interface ResolveMaterialOptions {
  /** Glass tint (any CSS color, normally translucent white). */
  tint?: string;
  /** Fill for the `flat` material. */
  color?: string;
}

export interface ResolvedMaterial {
  /** What actually renders (glass may degrade to flat). */
  kind: LiquidMaterial;
  fillStyle: CSSProperties;
  /** Whether specular highlights should be painted. */
  specular: boolean;
}

const GLASS_TINT = "rgba(255,255,255,0.3)";
const GLASS_BACKDROP = "blur(16px) saturate(1.8)";
const GLASS_FALLBACK_FILL = "rgba(255,255,255,0.65)";
export const MERCURY_GRADIENT =
  "linear-gradient(150deg, #fdfdfe 0%, #ccd1d9 36%, #8d94a1 64%, #b7bcc7 84%, #e8eaef 100%)";

export function resolveMaterial(
  material: LiquidMaterial,
  options: ResolveMaterialOptions = {}
): ResolvedMaterial {
  if (material === "glass") {
    if (!supportsBackdropFilter()) {
      return {
        kind: "flat",
        fillStyle: { background: options.tint ?? GLASS_FALLBACK_FILL },
        specular: true,
      };
    }
    return {
      kind: "glass",
      fillStyle: {
        background: options.tint ?? GLASS_TINT,
        backdropFilter: GLASS_BACKDROP,
        WebkitBackdropFilter: GLASS_BACKDROP,
      },
      specular: true,
    };
  }
  if (material === "mercury") {
    return {
      kind: "mercury",
      fillStyle: { background: MERCURY_GRADIENT },
      specular: false,
    };
  }
  return {
    kind: "flat",
    fillStyle: { background: options.color ?? "currentColor" },
    specular: false,
  };
}
