// W6a · a bottom sheet for the phone (the project picker opens in one). It rises from the bottom edge, closes on
// Esc, on a tap on the dimmed table, or from its own Close button, keeps Tab inside while open, and hands focus
// back to whatever opened it. Targets are 44 px. With reduced motion it appears without moving.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { shellStyle } from "./shellStyle.js";
import { CloseIcon } from "./Shell.jsx";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EXIT_MS = 160;

export default function Sheet({ open, onClose, title, children, closeLabel = "Close", testId = "ws-bottom-sheet" }) {
  const id = useId();
  const panel = useRef(null);
  const opener = useRef(null);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  // Mount on open; on close play a short exit, then unmount and return focus.
  useEffect(() => {
    if (open) {
      opener.current = typeof document !== "undefined" ? document.activeElement : null;
      setClosing(false); setMounted(true);
      return undefined;
    }
    if (!mounted) return undefined;
    setClosing(true);
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    const t = setTimeout(() => {
      setMounted(false); setClosing(false);
      const back = opener.current; opener.current = null;
      if (back && typeof back.focus === "function" && back.isConnected) back.focus();
    }, reduce ? 0 : EXIT_MS);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- keyed on open only

  // Focus the first control inside once it is on screen.
  useEffect(() => {
    if (!mounted || closing) return;
    const first = panel.current?.querySelector(FOCUSABLE);
    (first || panel.current)?.focus();
  }, [mounted, closing]);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Escape") { e.stopPropagation(); onClose?.(); return; }
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll(FOCUSABLE)];
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, [onClose]);

  if (!mounted) return null;
  return (
    <div className="ws-bsheet-layer" style={shellStyle} data-closing={closing || undefined} data-testid={testId}>
      <div className="ws-bsheet-scrim" onClick={() => onClose?.()} aria-hidden="true" />
      <div ref={panel} className="ws-bsheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} tabIndex={-1} onKeyDown={onKeyDown}>
        <div className="ws-bsheet-head">
          <h2 id={`${id}-t`}>{title}</h2>
          <button type="button" className="ws-bsheet-close" onClick={() => onClose?.()} aria-label={closeLabel}><CloseIcon size={18} /></button>
        </div>
        <div className="ws-bsheet-body">{children}</div>
      </div>
    </div>
  );
}
