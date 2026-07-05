import type { LiquidIntensity } from "../components/intensity";
import type { SurfaceStyleProps } from "../components/surface";
import type { FluidTheme, ThemeMaterial } from "./theme";

/**
 * The derivation table: how each themeable component reads the semantic
 * theme. This is the one file to edit when tuning the themed look.
 *
 * Rules:
 * - Only explicitly-set theme tokens derive anything; an empty theme yields
 *   an empty overlay, so componenets keep their own defaults (0.4.0
 *   equivalence is structural, not tested-in).
 * - `accent` → glass tint via `color-mix()`, with a per-component share:
 *   surfaces that read louder (buttons, tooltips) take more accent than
 *   quiet ones (panels, tabs). Dark mode adds +4pts so glass reads over
 *   dark hosts.
 * - `surface` → the flat-material fill; `text` → glyph fill where the
 *   component renders liquid text.
 * - `accent` → control STATE fills raw (no color-mix): a switch's checked
 *   track, a slider/progress channel liquid — the state fill is the brand
 *   mark and reads at full strength against its neutral track.
 * - `radius` applies only where the component exposes a radius prop.
 */

export type ThemedComponentKey =
  | "Droplets"
  | "LiquidButton"
  | "LiquidCard"
  | "LiquidCheckbox"
  | "LiquidDialog"
  | "LiquidField"
  | "LiquidMenu"
  | "LiquidPanel"
  | "LiquidProgress"
  | "LiquidSlider"
  | "LiquidSwitch"
  | "LiquidTabs"
  | "LiquidText"
  | "LiquidToast"
  | "LiquidTooltip"
  | "MeniscusDivider"
  | "MorphSurface"
  | "Ripple"
  | "Thinking"
  | "VoiceBall";

/** What a theme may contribute to a component, beyond its explicit props. */
export interface SurfaceOverlay
  extends Pick<SurfaceStyleProps, "material" | "tint" | "color" | "intensity"> {
  radius?: number;
  /** Brand text color, for components that render a label over their own
   *  glass (LiquidButton) — the label must track the brand's ink. */
  ink?: string;
  /** Brand state color for a control's dedicated state-fill prop (switch
   *  `checkedTint`, slider/progress `fillTint`) — the RAW accent, no
   *  color-mix dilution: these fills carry on/progress state and ARE the
   *  brand mark, so they read at full strength against their neutral
   *  tracks. */
  stateTint?: string;
}

interface DerivationRule {
  /** Accent share (in %) of the derived glass tint; absent = no tint derivation. */
  tintAlpha?: number;
  /**
   * Which theme token the glass tint mixes from. Defaults to `"accent"`
   * (brand accent over glass, dark-mode boosted). `"surface"` is for
   * near-solid identities (LiquidToast): the tint IS the brand surface at a
   * high share, so dark-surface brands keep dark toasts. No dark boost —
   * the share is a readability floor, not a glass-legibility aid.
   */
  tintFrom?: "accent" | "surface";
  /**
   * Which theme token fills `color`. Containers fill from `surface`; selection
   * and ink surfaces (a tab's indicator pill, a button fill, ripple ink) fill
   * from `accent` — their flat fill IS the brand mark, and e.g. flat tabs
   * paint their active label white, which needs an accent pill under it, not
   * the brand's (usually light) surface. `text` fills glyphs.
   */
  colorFrom?: "surface" | "text" | "accent";
  /** Whether the component exposes a numeric radius prop. */
  radius?: boolean;
  /** Whether the component receives the brand text color as label ink. */
  ink?: boolean;
  /** Whether the raw accent feeds the component's dedicated state-fill
   *  prop (see `SurfaceOverlay.stateTint`). */
  stateTint?: boolean;
}

const DERIVATION: Record<ThemedComponentKey, DerivationRule> = {
  Droplets: { tintAlpha: 18, colorFrom: "surface" },
  LiquidButton: { tintAlpha: 20, colorFrom: "accent", ink: true },
  LiquidCard: { tintAlpha: 14, colorFrom: "surface", radius: true },
  // The checked pool rides the shared tint/color (no dedicated state-fill
  // prop), so the accent arrives through them at a strong share — the pool
  // is state, not container glass.
  LiquidCheckbox: { tintAlpha: 45, colorFrom: "accent" },
  LiquidDialog: { tintAlpha: 16, colorFrom: "surface", radius: true },
  LiquidField: { tintAlpha: 10, colorFrom: "surface", radius: true },
  LiquidMenu: { tintAlpha: 12, colorFrom: "surface", radius: true },
  LiquidPanel: { tintAlpha: 12, colorFrom: "surface", radius: true },
  LiquidProgress: { stateTint: true },
  LiquidSlider: { stateTint: true },
  LiquidSwitch: { stateTint: true },
  LiquidTabs: { tintAlpha: 12, colorFrom: "accent" },
  LiquidText: { colorFrom: "text" },
  // Near-solid identity: a toast sits over unknown content, so its tint is
  // the brand SURFACE at a high share (dark brands keep dark toasts), and
  // the message ink pairs with that fill (see LiquidToast's ink wiring).
  LiquidToast: { tintAlpha: 88, tintFrom: "surface", colorFrom: "surface", ink: true },
  LiquidTooltip: { tintAlpha: 18, colorFrom: "surface" },
  MeniscusDivider: { tintAlpha: 14, colorFrom: "surface" },
  MorphSurface: { tintAlpha: 16, colorFrom: "surface", radius: true },
  Ripple: { tintAlpha: 14, colorFrom: "accent" },
  Thinking: { tintAlpha: 16, colorFrom: "surface" },
  VoiceBall: { tintAlpha: 16, colorFrom: "surface" },
};

export const THEMEABLE_COMPONENTS = Object.keys(DERIVATION) as ThemedComponentKey[];

const DARK_TINT_BOOST = 4;

export function deriveSurfaceOverlay(
  theme: FluidTheme,
  component: ThemedComponentKey,
): SurfaceOverlay {
  const rule = DERIVATION[component];
  const overlay: SurfaceOverlay = {};

  if (theme.material !== undefined) overlay.material = theme.material satisfies ThemeMaterial;
  if (theme.intensity !== undefined) overlay.intensity = theme.intensity satisfies LiquidIntensity;

  if (rule.tintAlpha !== undefined) {
    if (rule.tintFrom === "surface") {
      if (theme.surface !== undefined) {
        overlay.tint = `color-mix(in srgb, ${theme.surface} ${rule.tintAlpha}%, transparent)`;
      }
    } else if (theme.accent !== undefined) {
      const alpha = rule.tintAlpha + (theme.mode === "dark" ? DARK_TINT_BOOST : 0);
      overlay.tint = `color-mix(in srgb, ${theme.accent} ${alpha}%, transparent)`;
    }
  }

  if (rule.colorFrom === "surface" && theme.surface !== undefined) {
    overlay.color = theme.surface;
  } else if (rule.colorFrom === "text" && theme.text !== undefined) {
    overlay.color = theme.text;
  } else if (rule.colorFrom === "accent" && theme.accent !== undefined) {
    overlay.color = theme.accent;
  }

  if (rule.radius && theme.radius !== undefined) overlay.radius = theme.radius;
  if (rule.ink && theme.text !== undefined) overlay.ink = theme.text;
  if (rule.stateTint && theme.accent !== undefined) overlay.stateTint = theme.accent;

  return overlay;
}
