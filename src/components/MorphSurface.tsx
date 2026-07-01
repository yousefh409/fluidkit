/**
 * The flagship morph primitive: `<MorphSurface>` structurally enforces the
 * library's one non-negotiable rule — animate the surface, never the text.
 *
 * The SURFACE (shape/glass/blob) and the CONTENT (text/controls) are always
 * rendered as separate siblings. The surface is a `motion.[tag]` driven by
 * Motion's `layout` (real layout-box tweening, no hand-rolled FLIP); the
 * content sits in its own, un-scaled wrapper and only cross-fades between
 * states via `AnimatePresence`. Because content is never a descendant of the
 * surface, nothing that scales/resizes the surface's box can ever touch a
 * glyph.
 *
 * The consumer controls the surface's open/closed geometry via CSS, keyed
 * off `data-open` on the surface element (e.g. `.glass[data-open="true"]`).
 */

import type { CSSProperties, ElementType, ReactNode } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { useMorph } from "../hooks";

export interface MorphSurfaceProps {
  /** Current open/closed state. */
  open: boolean;
  /** Applied to the surface element (the shape/glass/blob layer). */
  surface?: { className?: string; style?: CSSProperties };
  /** The content layer — swapped/cross-faded per `open`. Never scaled. */
  children: ReactNode;
  /** Motion transition override for the surface tween + content cross-fade. */
  transition?: Transition;
  /** Element tag for the surface. Defaults to `"div"`. */
  as?: keyof JSX.IntrinsicElements;
  /** Called when the surface's layout animation completes. */
  onMorphComplete?: () => void;
  /** Applied to the outer wrapper. */
  className?: string;
  /** Applied to the outer wrapper. */
  style?: CSSProperties;
}

// `motion` pre-builds a component per standard HTML tag (motion.div,
// motion.section, ...), so indexing by `as` reuses a stable component
// identity across renders — unlike `motion.create(tag)`, which would create
// a *new* component type every render and force a remount.
const motionTags = motion as unknown as Record<string, ElementType>;

export function MorphSurface({
  open,
  surface,
  children,
  transition,
  as = "div",
  onMorphComplete,
  className,
  style,
}: MorphSurfaceProps) {
  const { surfaceProps, contentProps, prefersReducedMotion } = useMorph({
    open,
    transition,
    onMorphComplete,
  });
  const { key: contentKey, ...restContentProps } = contentProps;

  const MotionSurface = motionTags[as] ?? motion.div;

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <MotionSurface
        data-fluidkit="morph-surface"
        data-motion={prefersReducedMotion ? "snap" : "layout"}
        className={surface?.className}
        style={{ position: "absolute", inset: 0, ...surface?.style }}
        {...surfaceProps}
      />
      <div data-fluidkit="morph-content" style={{ position: "relative" }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={contentKey} {...restContentProps}>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
