// W6a · the shell's one status line. It replaces the stacked banners with one sentence in words ("2 changes waiting
// for signal") and at most a few actions beside it (Retry, Discard). tone: "calm" | "waiting" | "problem".
// It is a live region, so a change is read out once; actions are real buttons, 44 px tall.
export default function StatusLine({ text, tone = "calm", actions = [], busy = false, testId = "ws-status" }) {
  if (!text) return null;
  return (
    <div className="ws-status" data-tone={tone} data-busy={busy || undefined} data-testid={testId}>
      <p className="ws-status-text" role="status" aria-live="polite">{text}</p>
      {actions.length > 0 && (
        <div className="ws-status-actions">
          {actions.map((a) => (
            <button key={a.key || a.id} type="button" className="ws-status-btn" data-primary={a.primary || undefined}
              disabled={a.disabled || busy} onClick={a.onClick} aria-label={a.ariaLabel || undefined}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
