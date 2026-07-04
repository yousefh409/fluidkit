/**
 * A notification badge that ABSORBS its increments: when `count` goes up,
 * a small droplet appears beside the badge and merges into its body
 * through a real metaball bridge (the Droplets recipe at badge scale),
 * then drains in as the number cross-fades. The text itself never scales
 * or travels — only the liquid moves (the library's core principle).
 * Decrements just cross-fade.
 *
 * Wraps an anchor (`children`) with the badge pinned to its top-right
 * corner, or renders standalone. The badge is decorative (`aria-hidden`):
 * put the real count in accessible text (e.g. the anchor's `aria-label`),
 * where screen readers announce it on their own terms.
 *
 * Reduced motion: the count cross-fades; no droplet.
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "motion/react";
import {
  LiquidRenderer,
  TensionField,
  circlePath,
  defaultLight,
  resolveMaterial,
  roundRectPath,
  specularPlacement,
} from "../liquid";
import type { LiquidBody, LiquidSceneHandle, SpecularSpot, Vec } from "../liquid";
import { useMotionSprings } from "../liquid/useMotionSprings";
import { usePrefersReducedMotion } from "../utils";
import { resolveIntensity } from "./intensity";
import type { LiquidIntensity } from "./intensity";
import type { SurfaceStyleProps } from "./surface";

export interface LiquidBadgeProps
  extends SurfaceStyleProps,
    Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** The count. `0` hides the badge unless `showZero`. */
  count: number;
  /** Cap: counts above render as `${max}+`. Defaults to `99`. */
  max?: number;
  /** Keep the badge visible at zero. Defaults to `false`. */
  showZero?: boolean;
  /** The element the badge pins to; omit to render standalone. */
  children?: ReactNode;
  /** Badge tint. Defaults to a quiet red. */
  tint?: string;
  /**
   * How loudly the material reads. Defaults to `"present"` — the badge is
   * a droplet visual and carries Droplets' specular brightness (documented
   * divergence from the pack's `"whisper"`).
   */
  intensity?: LiquidIntensity;
}

const BADGE_H = 18;
const BLEED = 16;
/** Incoming droplet: size vs the badge, arrival spring, and drain. */
const DROP_R = 4.5;
const ARRIVE_SPRING = { stiffness: 260, damping: 18 };
const DRAIN_TAU_MS = 90;
const SETTLE_MS = 800;
const DEFAULT_TINT = "rgba(224, 82, 82, 0.5)";

interface Scene {
  path: string;
  speculars: SpecularSpot[];
}

export function LiquidBadge({
  count,
  max = 99,
  showZero = false,
  children,
  material = "glass",
  tint = DEFAULT_TINT,
  color,
  intensity = "present",
  light,
  reflection = true,
  refraction: _refraction, // reserved: edge lensing is not wired on badges yet
  shadow = true,
  className,
  style,
  ...rest
}: LiquidBadgeProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const animating = !prefersReducedMotion;

  const text = count > max ? `${max}+` : String(count);
  const visible = count > 0 || showZero;

  /* The label defines the badge's size (Tooltip's pattern). */
  const labelRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    const measure = () =>
      setSize((prev) => {
        const w = Math.max(BADGE_H, Math.round(el.offsetWidth) + 10);
        const h = BADGE_H;
        return prev && prev.w === w ? prev : { w, h };
      });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible]);

  const W = (size?.w ?? BADGE_H) + BLEED * 2;
  const H = BADGE_H + BLEED * 2;
  const cx = W / 2;
  const cy = H / 2;

  const resolved = useMemo(
    () => resolveMaterial(material, { tint, color }),
    [material, tint, color]
  );
  const volume = resolveIntensity(intensity);
  const sceneLight = useMemo<Vec | null>(() => {
    if (!reflection || light === null) return null;
    return light ? { x: light.x + BLEED, y: light.y + BLEED } : defaultLight(W, H);
  }, [reflection, light, W, H]);

  /* Incoming droplet: one spring slot for its approach (1 = away, 0 = in). */
  const approach = useMotionSprings(1, () => 0, ARRIVE_SPRING);
  const dropR = useRef(0);
  const [settling, setSettling] = useState(false);
  const settlingRef = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tension = useRef(new TensionField());

  const prevCount = useRef(count);
  useEffect(() => {
    const increment = count > prevCount.current;
    prevCount.current = count;
    if (!increment || !animating || !visible) return;
    dropR.current = DROP_R;
    approach.values[0].set(1);
    approach.setTargets([0]);
    settlingRef.current = true;
    setSettling(true);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      settlingRef.current = false;
      setSettling(false);
    }, SETTLE_MS);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, animating, visible]);

  const buildScene = (away: number, r: number): Scene => {
    if (!size) return { path: "", speculars: [] };
    let path = roundRectPath({ x: cx, y: cy }, size.w, BADGE_H, BADGE_H / 2);
    const speculars: SpecularSpot[] = [];
    if (resolved.specular && sceneLight) {
      speculars.push(
        specularPlacement(
          { x: cx, y: cy, r: BADGE_H * 0.48 },
          sceneLight,
          volume
        )
      );
    }
    if (r > 0.5) {
      // The droplet flies in from the upper right; a phantom body at the
      // badge's edge anchors the bridge (the Tooltip trick).
      const edge: LiquidBody = {
        id: "edge",
        x: cx + size.w / 2 - 6,
        y: cy - BADGE_H / 2 + 5,
        r: 6,
      };
      const drop: LiquidBody = {
        id: "drop",
        x: edge.x + away * (BLEED * 0.8),
        y: edge.y - away * (BLEED * 0.7),
        r,
      };
      path += circlePath(drop, drop.r);
      path += tension.current.bridges([edge, drop]);
      if (resolved.specular && sceneLight) {
        speculars.push(specularPlacement(drop, sceneLight, volume));
      }
    }
    return { path, speculars };
  };

  const staticScene = useMemo(
    () => buildScene(0, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size, resolved.specular, sceneLight, volume]
  );

  const renderer = useRef<LiquidSceneHandle>(null);
  useEffect(() => {
    if (!(animating && settlingRef.current))
      renderer.current?.setScene(staticScene);
  }, [animating, settling, staticScene]);

  useAnimationFrame((_, delta) => {
    if (!animating || !settling) return;
    const away = approach.values[0].get();
    if (dropR.current > 0 && away < 0.12) {
      dropR.current *= Math.exp(-delta / DRAIN_TAU_MS);
      if (dropR.current < 0.3) dropR.current = 0;
    }
    renderer.current?.setScene(buildScene(Math.max(away, 0), dropR.current));
  });

  const badge = visible ? (
    <span
      data-fluidkit="liquid-badge"
      data-animating={animating && settling}
      aria-hidden="true"
      className={children == null ? className : undefined}
      style={{
        position: children == null ? "relative" : "absolute",
        top: children == null ? undefined : 0,
        right: children == null ? undefined : 0,
        transform: children == null ? undefined : "translate(40%, -40%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: BADGE_H,
        height: BADGE_H,
        padding: "0 5px",
        ...(children == null ? style : undefined),
      }}
      {...(children == null ? rest : {})}
    >
      <span aria-hidden style={{ position: "absolute", inset: -BLEED }}>
        {staticScene.path && (
          <LiquidRenderer
            ref={renderer}
            path={staticScene.path}
            material={resolved}
            speculars={staticScene.speculars}
            specularSlots={resolved.specular && sceneLight ? 2 : 0}
            shadow={shadow}
          />
        )}
      </span>
      <span
        ref={labelRef}
        key={text}
        style={{
          position: "relative",
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1,
          // The number only ever cross-fades — never scales, never travels.
          animation: animating ? "fluidkit-badge-fade 160ms ease" : undefined,
        }}
      >
        {text}
      </span>
      {animating && (
        <style>{`@keyframes fluidkit-badge-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
      )}
    </span>
  ) : null;

  if (children == null) return badge;
  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-flex", ...style }}
      {...rest}
    >
      {children}
      {badge}
    </span>
  );
}
