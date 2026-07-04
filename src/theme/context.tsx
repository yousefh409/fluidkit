import { createContext, useContext, useMemo, type ReactNode } from "react";
import { deriveSurfaceOverlay, type SurfaceOverlay, type ThemedComponentKey } from "./derive";
import type { FluidTheme } from "./theme";

const FluidThemeContext = createContext<FluidTheme>({});

export interface FluidThemeProviderProps {
  theme: FluidTheme;
  children?: ReactNode;
}

/**
 * Supplies the semantic theme to every fluidkit component below it.
 * Nesting merges token-by-token, inner tokens winning. With no provider
 * mounted the theme is empty and components render exactly their 0.4.0
 * defaults.
 */
export function FluidThemeProvider({ theme, children }: FluidThemeProviderProps) {
  const parent = useContext(FluidThemeContext);
  const merged = useMemo(() => ({ ...parent, ...theme }), [parent, theme]);
  return <FluidThemeContext.Provider value={merged}>{children}</FluidThemeContext.Provider>;
}

/** The merged theme in scope (empty object outside any provider). */
export function useFluidTheme(): FluidTheme {
  return useContext(FluidThemeContext);
}

/**
 * The theme's contribution to one component: a partial overlay the component
 * folds in *below* its explicit props and *above* its built-in defaults —
 * `const { material = overlay.material ?? "glass" } = props`.
 */
export function useThemedSurface(component: ThemedComponentKey): SurfaceOverlay {
  const theme = useFluidTheme();
  return useMemo(() => deriveSurfaceOverlay(theme, component), [theme, component]);
}
