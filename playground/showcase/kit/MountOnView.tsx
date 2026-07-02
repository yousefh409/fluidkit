import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Site chrome: mounts children the FIRST time the stage scrolls into view,
 * and never unmounts them after. The GPU demos boot a real WebGL context on
 * mount (and WaterField keeps issuing draw calls each frame even while
 * paused), so mounting them eagerly would bill every docs visitor for live
 * GPU contexts at page load, for stages further down the page.
 */
export function MountOnView({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSeen(true);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);
  return <div ref={ref} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{seen ? children : null}</div>;
}
