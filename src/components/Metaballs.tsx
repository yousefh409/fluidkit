/**
 * Same-color, borderless blobs that orbit and fuse like mercury via the
 * shared goo SVG filter. The batteries-included component built on top of
 * `useGoo()`.
 *
 * Per-blob drift is derived deterministically from each blob's index (and
 * the optional `seed`) using trig, not `Math.random()` — so renders are
 * reproducible and multiple instances on a page can still look distinct by
 * passing different `seed`s.
 */

import type { CSSProperties, HTMLAttributes } from "react";
import { motion } from "motion/react";
import { useGoo } from "../hooks";
import { resolveColor, useInView, usePrefersReducedMotion } from "../utils";

export interface MetaballsProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of blobs. */
  count?: number;
  /** Blob color. Defaults to `currentColor`. */
  color?: string;
  /** Blob diameter in px. */
  size?: number;
  /** Px range the blobs drift across. */
  spread?: number;
  /** Animation speed multiplier (higher = faster). */
  speed?: number;
  /** Deterministic per-instance offset so multiple instances differ. */
  seed?: number;
}

const DEFAULT_COUNT = 3;
const DEFAULT_SIZE = 60;
const DEFAULT_SPREAD = 80;
const DEFAULT_SPEED = 1;
const BASE_DURATION_S = 4;

/** Deterministic per-blob phase, derived from index/seed (no Math.random). */
function blobAngle(index: number, seed: number): number {
  // An irrational-ish multiplier spreads phases out instead of clustering
  // them at round fractions of a turn.
  return index * 2.399963 + seed * 0.618034;
}

interface Blob {
  /** Neutral (static / reduced-motion) offset from container center. */
  baseX: number;
  baseY: number;
  /** Orbit half-extent the blob mirrors between when animating. */
  driftX: number;
  driftY: number;
  durationS: number;
}

function layoutBlobs(
  count: number,
  size: number,
  spread: number,
  speed: number,
  seed: number
): Blob[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = blobAngle(index, seed);
    const amplitude = spread * (0.35 + 0.1 * (index % 3));
    return {
      baseX: Math.cos(angle) * size * 0.2,
      baseY: Math.sin(angle) * size * 0.2,
      driftX: Math.cos(angle) * amplitude,
      driftY: Math.sin(angle) * amplitude,
      durationS: (BASE_DURATION_S + index * 0.6) / speed,
    };
  });
}

export function Metaballs({
  count = DEFAULT_COUNT,
  color,
  size = DEFAULT_SIZE,
  spread = DEFAULT_SPREAD,
  speed = DEFAULT_SPEED,
  seed = 0,
  className,
  style,
  ...rest
}: MetaballsProps) {
  const { style: gooStyle } = useGoo();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  const animating = !prefersReducedMotion && inView;
  const resolvedColor = resolveColor(color);
  const containerSize = size + spread;
  const blobs = layoutBlobs(count, size, spread, speed, seed);

  const containerStyle: CSSProperties = {
    position: "relative",
    width: containerSize,
    height: containerSize,
    ...gooStyle,
    ...style,
  };

  return (
    <div
      ref={ref}
      className={className}
      style={containerStyle}
      data-animating={animating}
      {...rest}
    >
      {blobs.map((blob, index) => {
        const left = (containerSize - size) / 2 + blob.baseX;
        const top = (containerSize - size) / 2 + blob.baseY;

        return (
          <motion.div
            key={index}
            data-fluidkit="metaball"
            style={{
              position: "absolute",
              left,
              top,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: resolvedColor,
            }}
            animate={
              animating
                ? { x: [-blob.driftX, blob.driftX], y: [-blob.driftY, blob.driftY] }
                : undefined
            }
            transition={
              animating
                ? {
                    duration: blob.durationS,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
