import type { LiquidIntensity } from "../components/intensity";

/**
 * Materials a brand theme may set. `caustics` is deliberately absent — it is
 * an ambient art material, not a brand surface, so themes cannot switch a
 * whole app onto it.
 */
export type ThemeMaterial = "glass" | "flat";

/**
 * The semantic theme: meaning-level tokens a brand supplies once, from which
 * each component derives its own surface styling (see `derive.ts`). Every
 * token is optional, and only explicitly-set tokens derive anything — an
 * absent token never overrides a component's own default, so deliberate
 * per-component divergences (flat tabs, present buttons) survive a theme
 * that only sets colors.
 *
 * `background`, `mutedText`, and `fontFamily` are accepted but inert in 0.5:
 * no current component consumes them. They are reserved for the controls
 * wave (fields, menus) so a theme written today keeps working.
 */
export interface FluidTheme {
  /** Brand accent — tints glass surfaces (per-component alpha). */
  accent?: string;
  /** Brand surface color — the flat-material fill. */
  surface?: string;
  /** Primary text/ink color — glyph fill for text-rendering surfaces. */
  text?: string;
  /** Secondary text color. Reserved (inert in 0.5). */
  mutedText?: string;
  /** App background behind surfaces. Reserved (inert in 0.5). */
  background?: string;
  /** Font stack. Reserved (inert in 0.5). */
  fontFamily?: string;
  /** Corner radius in px, applied where components expose a radius prop. */
  radius?: number;
  /** Color scheme; dark raises derived tint alphas so glass reads. */
  mode?: "light" | "dark";
  /** Rendered material for themed surfaces. */
  material?: ThemeMaterial;
  /** How loudly materials read (fluidkit's existing intensity scale). */
  intensity?: LiquidIntensity;
}
