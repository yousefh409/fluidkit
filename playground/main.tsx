import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Metaballs, ThinkingBlob, MorphSurface } from "../src/index";

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="stage">{children}</div>
      <div className="meta">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function MorphDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="ctl"
        style={{ position: "absolute", left: 12, bottom: 12, zIndex: 5 }}
        onClick={() => setOpen((v) => !v)}
      >
        Toggle morph
      </button>
      <MorphSurface open={open} surface={{ className: "demo-surface" }}>
        {open ? (
          <div className="panel-body">
            <div className="ph">
              <span className="dot" />
              Northwind Assistant
            </div>
            <div className="row me">Move $500 to savings</div>
            <div className="row">Done — scheduled for tomorrow. Want a reminder?</div>
          </div>
        ) : (
          <div className="pill-label">
            <span className="dot" />
            Ask fluidkit
          </div>
        )}
      </MorphSurface>
    </>
  );
}

function App() {
  return (
    <>
      <h1>fluidkit playground</h1>
      <p className="sub">Live primitives rendered from source, on the prototype backdrop.</p>
      <div className="grid">
        <Card title="Metaballs" desc="Same-color blobs that fuse like mercury (goo filter).">
          <div style={{ color: "#e7e8ec" }}>
            <Metaballs count={4} size={64} spread={90} />
          </div>
        </Card>
        <Card title="ThinkingBlob" desc="Organic working indicator — blobs merge/split.">
          <div style={{ color: "#e7e8ec", transform: "scale(2)" }}>
            <ThinkingBlob />
          </div>
        </Card>
        <Card title="MorphSurface" desc="Launcher → panel. Surface morphs; text stays crisp.">
          <MorphDemo />
        </Card>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
