/**
 * LAB (throwaway) — LiquidToast prototype.
 *
 * A notification droplet condenses at the screen edge (Tooltip's condense
 * mechanics scaled up: geometry grows from a droplet while the canvas
 * un-blurs) and evaporates on dismiss (blur + lift + fade, condense played
 * backward). Round 2 adds the classic toast controls: a close button
 * (toggleable), auto-dismiss with pause-on-hover, and an action button.
 * Raw knobs; deleted before the wave merges.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "motion/react";
import {
  LiquidRenderer,
  defaultLight,
  resolveMaterial,
  roundRectPath,
  specularPlacement,
} from "../../../../src/liquid";
import type { LiquidSceneHandle } from "../../../../src/liquid";
import { useMotionSprings } from "../../../../src/liquid/useMotionSprings";
import { Controls, PageLayout, Slider as Knob, Stage, Toggle } from "../../kit";

const TOAST_W = 260;
const TOAST_H = 46;
const BLEED = 24;
const RADIUS = 16;

/** Base condense spring (Tooltip's), scaled by pace like condenseSpring. */
const BASE = { stiffness: 260, damping: 20 };
const paced = (pace: number) => ({
  stiffness: BASE.stiffness * pace * pace,
  damping: BASE.damping * pace,
});

interface ToastProtoProps {
  msg: string;
  action?: string;
  leaving: boolean;
  onGone: () => void;
  onDismiss: () => void;
  showClose: boolean;
  durationMs: number; // 0 = sticky
  condensePace: number;
  evaporatePace: number;
  blurAmp: number;
  lift: number;
}

function ToastProto({
  msg,
  action,
  leaving,
  onGone,
  onDismiss,
  showClose,
  durationMs,
  condensePace,
  evaporatePace,
  blurAmp,
  lift,
}: ToastProtoProps) {
  const W = TOAST_W + BLEED * 2;
  const H = TOAST_H + BLEED * 2;
  const cx = W / 2;
  const cy = H / 2;

  const light = useMemo(() => defaultLight(W, H), [W, H]);
  const material = useMemo(
    () => resolveMaterial("glass", { tint: "rgba(255, 255, 255, 0.5)" }),
    []
  );

  // One spring slot: the condense fraction f (0 = droplet mist, 1 = seated).
  const f = useMotionSprings(1, () => 0, paced(condensePace));
  useEffect(() => {
    f.setTargets([leaving ? 0 : 1], paced(leaving ? evaporatePace : condensePace));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  // Auto-dismiss: the clock only runs while the pointer is elsewhere.
  const remaining = useRef(durationMs);
  const hovered = useRef(false);

  const renderer = useRef<LiquidSceneHandle>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gone = useRef(false);

  useAnimationFrame((_, delta) => {
    const v = f.values[0].get();
    if (leaving && v < 0.02 && !gone.current) {
      gone.current = true;
      onGone();
      return;
    }
    if (!leaving && durationMs > 0 && !hovered.current && v > 0.9) {
      remaining.current -= delta;
      if (remaining.current <= 0) onDismiss();
    }
    // Geometry grows from a droplet; never collapses below 0.3 (the canvas
    // fades out underneath it, same trick as LiquidTooltip).
    const grow = Math.max(v, 0.3);
    const pw = TOAST_W * grow;
    const ph = TOAST_H * grow;
    renderer.current?.setScene({
      path: roundRectPath(
        { x: cx, y: cy },
        pw,
        ph,
        Math.min(RADIUS, ph / 2, pw / 2)
      ),
      speculars: [
        specularPlacement(
          { x: cx, y: cy, r: Math.min(pw, ph) * 0.48 },
          light,
          0.28
        ),
      ],
    });
    if (canvasRef.current) {
      const s = canvasRef.current.style;
      s.opacity = String(Math.max(0, Math.min(1, v / 0.3)));
      s.filter = `blur(${((1 - v) * blurAmp).toFixed(1)}px)`;
      // Condensing settles down into place; evaporating lifts up and away.
      const dy = leaving ? -(1 - v) * lift : (1 - v) * lift * 0.35;
      s.transform = `translateY(${dy.toFixed(1)}px)`;
    }
    if (contentRef.current) {
      // Text never scales — it only cross-fades in once the pill has formed.
      contentRef.current.style.opacity = String(
        Math.max(0, Math.min(1, (v - 0.55) / 0.45))
      );
    }
  });

  return (
    <div
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
      style={{ position: "relative", width: W, height: H, margin: -BLEED }}
    >
      <div ref={canvasRef} style={{ position: "absolute", inset: 0 }}>
        <LiquidRenderer
          ref={renderer}
          path=""
          material={material}
          specularSlots={1}
          shadow
        />
      </div>
      <div
        ref={contentRef}
        style={{
          position: "absolute",
          inset: BLEED,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 12px 0 18px",
          fontSize: 13,
          fontWeight: 500,
          color: "#3a4050",
          opacity: 0,
        }}
      >
        <span style={{ flex: 1 }}>{msg}</span>
        {action && (
          <button
            onClick={onDismiss}
            style={{
              border: "none",
              borderRadius: 10,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 600,
              color: "#2d3648",
              background: "rgba(60, 70, 100, 0.12)",
              cursor: "pointer",
            }}
          >
            {action}
          </button>
        )}
        {showClose && (
          <button
            onClick={onDismiss}
            aria-label="Close"
            style={{
              border: "none",
              width: 22,
              height: 22,
              borderRadius: 11,
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              lineHeight: 1,
              color: "#5a6275",
              background: "rgba(60, 70, 100, 0.10)",
              cursor: "pointer",
              flex: "none",
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

const MESSAGES = [
  "Changes saved",
  "Link copied",
  "Upload complete",
  "Draft restored",
];

interface ToastItem {
  id: number;
  msg: string;
  action?: string;
  leaving: boolean;
}

export default function ToastLabPage() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showClose, setShowClose] = useState(true);
  const [durationSec, setDurationSec] = useState(5);
  const [condensePace, setCondensePace] = useState(1);
  const [evaporatePace, setEvaporatePace] = useState(1.3);
  const [blurAmp, setBlurAmp] = useState(14);
  const [lift, setLift] = useState(26);
  const [gap, setGap] = useState(10);
  const nextId = useRef(1);

  const fire = (n = 1, action?: string) =>
    setToasts((list) => [
      ...list,
      ...Array.from({ length: n }, () => {
        const id = nextId.current++;
        return {
          id,
          msg: action ? "Message deleted" : MESSAGES[id % MESSAGES.length],
          action,
          leaving: false,
        };
      }),
    ]);
  const dismiss = (id: number) =>
    setToasts((list) =>
      list.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
  const dismissOldest = () => {
    const oldest = toasts.find((t) => !t.leaving);
    if (oldest) dismiss(oldest.id);
  };
  const remove = (id: number) =>
    setToasts((list) => list.filter((t) => t.id !== id));

  return (
    <PageLayout
      title="Lab · Toast"
      description="Prototype: a notification droplet that condenses at the screen edge and evaporates on dismiss (blur + lift + fade). Classic controls: close button, auto-dismiss with pause-on-hover, action button."
      hero={
        <>
          <Stage wall>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: 420,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: 18,
                  bottom: 12,
                  display: "flex",
                  flexDirection: "column-reverse",
                }}
              >
                {toasts.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      height: t.leaving ? 0 : TOAST_H + gap,
                      transition: "height 320ms ease",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "flex-end",
                      overflow: "visible",
                    }}
                  >
                    <ToastProto
                      msg={t.msg}
                      action={t.action}
                      leaving={t.leaving}
                      onGone={() => remove(t.id)}
                      onDismiss={() => dismiss(t.id)}
                      showClose={showClose}
                      durationMs={durationSec * 1000}
                      condensePace={condensePace}
                      evaporatePace={evaporatePace}
                      blurAmp={blurAmp}
                      lift={lift}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Stage>
          <Controls>
            <button className="btn" onClick={() => fire()}>
              toast
            </button>
            <button className="btn" onClick={() => fire(3)}>
              toast ×3
            </button>
            <button className="btn" onClick={() => fire(1, "Undo")}>
              toast with action
            </button>
            <button className="btn" onClick={dismissOldest}>
              dismiss oldest
            </button>
            <Toggle label="close button" value={showClose} set={setShowClose} />
            <Knob
              label="auto-dismiss (0 = sticky)"
              value={durationSec}
              set={setDurationSec}
              min={0}
              max={10}
              step={0.5}
              suffix="s"
            />
            <Knob
              label="condense pace"
              value={condensePace}
              set={setCondensePace}
              min={0.4}
              max={2.5}
              step={0.1}
              suffix="×"
            />
            <Knob
              label="evaporate pace"
              value={evaporatePace}
              set={setEvaporatePace}
              min={0.4}
              max={2.5}
              step={0.1}
              suffix="×"
            />
            <Knob
              label="blur"
              value={blurAmp}
              set={setBlurAmp}
              min={0}
              max={30}
              step={1}
              suffix="px"
            />
            <Knob
              label="lift"
              value={lift}
              set={setLift}
              min={0}
              max={80}
              step={2}
              suffix="px"
            />
            <Knob
              label="stack gap"
              value={gap}
              set={setGap}
              min={4}
              max={24}
              step={1}
              suffix="px"
            />
          </Controls>
        </>
      }
    />
  );
}
