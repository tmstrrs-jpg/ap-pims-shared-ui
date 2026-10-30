// Copied from ap-pims-pm-portal src/workspace/Shell.jsx @ ece372b7 (W1, #1037). Shared-ui is now the one copy; change it here.
// Two differences from the portal copy, both so shared-ui gains no dependency and no side effect:
//   - the close icon is an inline SVG (the portal uses lucide-react's X; same 16 px, same stroke);
//   - the stylesheet is not imported here. Consumers import 'ap-pims-shared-ui/workspace.css' (or the vendored
//     workspace.css) once, next to tokens.css.
//
// W1 · the workspace shell: the frame every later workspace screen inherits (brief Part B). A near-black table,
// four bars with no text or icons (left Index, top Dashboard, right This job, bottom Mine), each opening its panel
// in a dark shade of its own colour. Opening one closes any other; Esc or a tap on the table closes it.
// Later briefs restyle screens INTO this component; they never copy it.
import { useCallback, useEffect, useId, useState } from "react";
import { BARS } from "./tokens.js";
import { shellStyle, useWorkspaceFonts } from "./shellStyle.js";

const EDGES = ["left", "top", "right", "bottom"];

export function CloseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

// panels: { index, dashboard, job, mine } -> React nodes (each may be a function of { close, open }; `open` is W8b,
// as in the portal copy, so a panel can wait to read until it is opened).
// counts (W8b, optional): { [bar key]: { value, label } } -> a small number beside that bar ("3"), and the bar's name
// read out with it ("Mine, 3 unread in Team Chat"). The bar itself stays without text; nothing shows for 0.
export default function Shell({ panels = {}, children, chatLine = null, label = "Workspace", counts = null }) {
  useWorkspaceFonts();
  const [open, setOpen] = useState(null);
  const baseId = useId();
  // Closing hands focus back to the bar that opened the panel.
  const close = useCallback(() => {
    setOpen((was) => {
      if (was) setTimeout(() => document.getElementById(`${baseId}-bar-${was}`)?.focus(), 0);
      return null;
    });
  }, [baseId]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <div className="ws-root" style={shellStyle} data-ws-root="" data-panel-open={open || "none"} aria-label={label}>
      <main className="ws-stage" onPointerDown={open ? close : undefined} data-scroll-root="">{children}</main>
      {EDGES.map((edge) => {
        const bar = BARS[edge];
        const id = `${baseId}-${bar.key}`;
        const isOpen = open === edge;
        const body = typeof panels[bar.key] === "function" ? panels[bar.key]({ close, open: isOpen }) : panels[bar.key];
        const count = counts?.[bar.key];
        const n = Math.max(0, Math.floor(Number(count?.value) || 0));
        return (
          <div key={edge}>
            <button
              id={`${baseId}-bar-${edge}`} type="button" className="ws-bar" data-edge={edge} data-testid={`ws-bar-${bar.key}`}
              style={{ "--bar": bar.color }}
              aria-label={n > 0 ? `${bar.label}, ${count.label || n}` : bar.label} aria-expanded={isOpen} aria-controls={id}
              onClick={() => setOpen((o) => (o === edge ? null : edge))}
            />
            {n > 0 && <span className="ws-bar-count" data-edge={edge} data-testid={`ws-bar-count-${bar.key}`} aria-hidden="true">{n > 99 ? "99+" : n}</span>}
            <section
              id={id} className="ws-panel" data-edge={edge} data-open={isOpen} data-testid={`ws-panel-${bar.key}`}
              style={{ "--panel": bar.panel }} aria-label={bar.label} aria-hidden={!isOpen} inert={!isOpen}
            >
              <button type="button" className="ws-panel-close" onClick={close} aria-label={`Close ${bar.label}`}><CloseIcon /></button>
              <h2>{bar.label}</h2>
              {body}
            </section>
          </div>
        );
      })}
      {chatLine}
    </div>
  );
}
