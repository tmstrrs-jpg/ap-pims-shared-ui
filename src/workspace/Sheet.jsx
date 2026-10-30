// W6a · a bottom sheet for the phone (the project picker opens in one). It rises from the bottom edge, closes on
// Esc, on a tap on the dimmed table, or from its own Close button, keeps Tab inside while open, and hands focus
// back to whatever opened it. Targets are 44 px. With reduced motion it appears without moving.
// UX fix (W6a review): a grab handle, and drag-to-dismiss on the handle and title row: a flick down (faster than
// DISMISS_VELOCITY px/ms) or a drag past DISMISS_DISTANCE closes it; dragging up meets growing resistance.
// On open, focus lands on the row marked aria-current (the open project) or data-autofocus, else the first control.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { shellStyle } from "./shellStyle.js";
import { CloseIcon } from "./Shell.jsx";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EXIT_MS = 160;
const DISMISS_VELOCITY = 0.11;
const DISMISS_DISTANCE = 120;
const PREFERRED = '[data-autofocus], [aria-current="true"], [aria-current="page"]';

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

  // Focus the current row (or the first control) once it is on screen.
  useEffect(() => {
    if (!mounted || closing) return;
    const preferred = panel.current?.querySelector(PREFERRED);
    const first = panel.current?.querySelector(FOCUSABLE);
    (preferred && preferred.matches(FOCUSABLE) ? preferred : first || panel.current)?.focus();
  }, [mounted, closing]);

  // Drag to dismiss. The transform is written straight onto the panel (no React state per frame).
  const drag = useRef(null);
  const onDragStart = useCallback((e) => {
    if (drag.current || e.button > 0 || e.target.closest?.("button")) return; // one pointer; Close stays a tap
    drag.current = { id: e.pointerId, y: e.clientY, t: performance.now(), dy: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (panel.current) panel.current.style.transition = "none";
  }, []);
  const onDragMove = useCallback((e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !panel.current) return;
    const raw = e.clientY - d.y;
    d.dy = raw >= 0 ? raw : -Math.sqrt(-raw) * 2; // up: damped, never a hard stop
    panel.current.style.transform = `translateY(${d.dy}px)`;
  }, []);
  const onDragEnd = useCallback((e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const el = panel.current;
    if (!el) return;
    const velocity = d.dy / Math.max(1, performance.now() - d.t);
    if (e.type !== "pointercancel" && (d.dy >= DISMISS_DISTANCE || (d.dy > 8 && velocity > DISMISS_VELOCITY))) {
      el.style.transition = `transform ${EXIT_MS}ms cubic-bezier(0.23, 1, 0.32, 1)`;
      el.style.transform = "translateY(100%)";
      onClose?.();
    } else {
      el.style.transition = ""; el.style.transform = "";
    }
  }, [onClose]);

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
        <div className="ws-bsheet-grip" data-testid={`${testId}-grip`} onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}>
          <span className="ws-bsheet-handle" aria-hidden="true" />
          <div className="ws-bsheet-head">
            <h2 id={`${id}-t`}>{title}</h2>
            <button type="button" className="ws-bsheet-close" onClick={() => onClose?.()} aria-label={closeLabel}><CloseIcon size={18} /></button>
          </div>
        </div>
        <div className="ws-bsheet-body">{children}</div>
      </div>
    </div>
  );
}
