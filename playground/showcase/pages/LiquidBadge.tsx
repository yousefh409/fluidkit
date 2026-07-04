import { useState } from "react";
import { LiquidBadge } from "fluidkit";
import {
  ColorField,
  Controls,
  PageLayout,
  Slider,
  Snippet,
  Stage,
  Toggle,
  glassTintFromHex,
} from "../kit";

/** A plain inbox glyph so the badge has something real to pin to. */
function InboxIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3a4050" strokeWidth="1.6" aria-hidden>
      <path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" />
      <path d="M3 13h5a4 4 0 0 0 8 0h5" />
    </svg>
  );
}

export default function LiquidBadgePage() {
  const [count, setCount] = useState(3);
  const [max, setMax] = useState(99);
  const [showZero, setShowZero] = useState(false);
  const [tint, setTint] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(0.7);
  const badgeTint = tint ? glassTintFromHex(tint) : undefined;

  return (
    <PageLayout
      title="LiquidBadge"
      description="A notification badge that absorbs its increments: bump the count and a droplet flies in and merges through a real metaball bridge. The number only cross-fades — text never scales."
      hero={
        <>
          <Stage wall hint="increment — watch the droplet absorb">
            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <button
                aria-label={`Inbox, ${count} unread`}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
                onClick={() => setCount((c) => c + 1)}
              >
                <LiquidBadge count={count} max={max} showZero={showZero} tint={badgeTint} intensity={intensity}>
                  <InboxIcon />
                </LiquidBadge>
              </button>
            </div>
          </Stage>
          <Controls>
            <button className="btn" onClick={() => setCount((c) => c + 1)}>
              +1
            </button>
            <button className="btn" onClick={() => setCount((c) => Math.max(0, c - 1))}>
              −1
            </button>
            <button className="btn" onClick={() => setCount(0)}>
              clear
            </button>
            <Slider label="max" value={max} set={setMax} min={9} max={999} step={10} />
            <Toggle label="show zero" value={showZero} set={setShowZero} />
            <Slider label="intensity" value={intensity} set={setIntensity} min={0} max={1} step={0.05} />
            <ColorField label="tint" value={tint} set={setTint} />
          </Controls>
        </>
      }
      usage={
        <Snippet
          code={`<LiquidBadge count={unread}${max !== 99 ? ` max={${max}}` : ""}${showZero ? " showZero" : ""}${badgeTint ? ` tint="${badgeTint}"` : ""}${intensity !== 0.7 ? ` intensity={${intensity}}` : ""}>
  <InboxIcon />
</LiquidBadge>

// the badge is decorative — put the real count in accessible text
<button aria-label={\`Inbox, \${unread} unread\`}>…</button>`}
        />
      }
    />
  );
}
