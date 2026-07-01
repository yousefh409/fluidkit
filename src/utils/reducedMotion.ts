/**
 * Shared reduced-motion resolution.
 *
 * This is the single place primitives consult to decide whether to animate.
 * The resolver's default is intentionally static-safe: when the user's
 * preference is unknown (e.g. `null` during SSR, before `matchMedia` can be
 * read), we treat that as "prefers reduced motion" so primitives render
 * their static fallback rather than animating by default.
 */

import { useReducedMotion } from "motion/react";

/**
 * Resolves a raw reduced-motion preference into a concrete boolean.
 *
 * - `true` → `true` (reduce motion)
 * - `false` → `false` (motion allowed)
 * - `null` / `undefined` (unknown, e.g. SSR) → `true` (static-safe default)
 */
export function resolvePrefersReducedMotion(
  prefersReducedMotion: boolean | null | undefined
): boolean {
  return prefersReducedMotion ?? true;
}

/**
 * Reads Motion's `useReducedMotion()` and resolves it to a concrete
 * boolean via {@link resolvePrefersReducedMotion}, so callers never have to
 * handle the `null` (unknown) case themselves.
 */
export function usePrefersReducedMotion(): boolean {
  const prefersReducedMotion = useReducedMotion();
  return resolvePrefersReducedMotion(prefersReducedMotion);
}
