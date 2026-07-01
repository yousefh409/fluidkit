/**
 * Headless morph primitive — the library's core principle, structurally
 * enforced: animate the surface, never the text.
 *
 * `useMorph` returns two disjoint prop bags:
 *  - `surfaceProps`: spread onto a `motion.[tag]` for the SURFACE (the
 *    shape/glass/blob). Drives Motion's `layout` so real layout boxes tween,
 *    instead of hand-rolled FLIP.
 *  - `contentProps`: spread onto a `motion.div` for the CONTENT (text/
 *    controls) rendered inside an `AnimatePresence` by the consumer. Content
 *    only cross-fades (opacity) and translates a few px — it is never
 *    scaled, because the consumer renders it as a separate sibling of the
 *    surface, not a descendant of anything the surface's `layout` transform
 *    touches.
 *
 * Under `prefers-reduced-motion`, the surface snaps (no layout tween) and
 * the content cross-fade drops to opacity-only, no translate.
 */

import type { Target, Transition } from "motion/react";
import { usePrefersReducedMotion } from "../utils";

export interface UseMorphOptions {
  /** Current open/closed state. Drives both the surface geometry (via the
   * consumer's CSS, keyed off `data-open`) and which content is shown. */
  open: boolean;
  /** Motion transition override for both the surface's layout tween and the
   * content cross-fade. Defaults to a springy, prototype-matching feel. */
  transition?: Transition;
  /** Called when the surface's layout animation finishes. */
  onMorphComplete?: () => void;
}

export interface UseMorphSurfaceProps {
  layout: boolean;
  transition: Transition;
  "data-open": boolean;
  onLayoutAnimationComplete?: () => void;
}

export interface UseMorphContentProps {
  key: string;
  initial: Target;
  animate: Target;
  exit: Target;
  transition: Transition;
}

export interface UseMorphResult {
  /** Spread onto the surface's `motion.[tag]`. */
  surfaceProps: UseMorphSurfaceProps;
  /** Spread onto the content's `motion.div`, inside the consumer's
   * `AnimatePresence`. */
  contentProps: UseMorphContentProps;
  /** Exposed for consumers who want to branch on it themselves. */
  prefersReducedMotion: boolean;
}

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
};

const REDUCED_MOTION_TRANSITION: Transition = { duration: 0 };

/** A few px of settle-in translate for the content cross-fade — enough to
 * read as motion, never enough to look like it's tracking the surface. */
const CONTENT_TRANSLATE_PX = 6;

export function useMorph({
  open,
  transition,
  onMorphComplete,
}: UseMorphOptions): UseMorphResult {
  const prefersReducedMotion = usePrefersReducedMotion();
  const resolvedTransition = transition ?? DEFAULT_TRANSITION;

  const surfaceProps: UseMorphSurfaceProps = {
    layout: !prefersReducedMotion,
    transition: resolvedTransition,
    "data-open": open,
    onLayoutAnimationComplete: onMorphComplete,
  };

  const contentProps: UseMorphContentProps = prefersReducedMotion
    ? {
        key: String(open),
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: REDUCED_MOTION_TRANSITION,
      }
    : {
        key: String(open),
        initial: { opacity: 0, y: CONTENT_TRANSLATE_PX },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -CONTENT_TRANSLATE_PX },
        transition: resolvedTransition,
      };

  return { surfaceProps, contentProps, prefersReducedMotion };
}
