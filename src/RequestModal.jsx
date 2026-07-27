// Generic "Request a change" submit form. Module-agnostic: pass an `actions`
// config (module-specific structured one-click fixes) and a `context`. Free-text
// requests need no config; structured actions render from the config's input spec.
//
// actions: [{ type, label, scope: 'transaction'|'card'|'any',
//             input: null | {kind:'number'|'select', placeholder, options?:[[v,label]]},
//             cast?: (v)=>any, describe: (action)=>string }]
//
// The body is a guided form rather than one free-text box: a complaint ("this is
// broken") is not buildable, but observed + expected behaviour is. The questions
// are laid out as one scrollable form instead of a multi-screen wizard — on a
// phone every extra step is another tap with the keyboard already covering half
// the viewport, and the goal is filing in under two minutes. `question` requests
// skip the guided pair and keep the plain free-text path.
//
// `supabase` is optional: it is only needed to upload screenshots, so a call site
// that doesn't pass one (PM Portal's older module-specific panels) still renders
// and submits — it just has no screenshot picker instead of failing at upload.

import { useState } from "react";
import { F } from "./theme";
import {
  REQUEST_KINDS as KINDS,
  MAX_SCREENSHOTS,
  screenshotRejection,
  uploadScreenshots,
} from "./requestsApi";

// Per-kind wording. Same two columns underneath; asking a superintendent for "the
// observed behaviour" gets a blank stare, so the prompt changes with the kind.
const PROMPTS = {
  data_fix: {
    observed: "What happened?",
    observedHint: "The wrong value, the error, what you saw on screen.",
    expected: "What should it have been?",
    expectedHint: "The correct value, or what you expected instead.",
  },
  improvement: {
    observed: "What's hard about it today?",
    observedHint: "The slow or awkward part of how it works now.",
    expected: "What should it do instead?",
    expectedHint: "Describe the version that would save you time.",
  },
};

export default function RequestModal({ supabase, context = {}, actions = [], onSubmit, onClose, accent = "#0e4c62" }) {
  const [kind, setKind] = useState("data_fix");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [observed, setObserved] = useState("");
  const [expected, setExpected] = useState("");
  const [shots, setShots] = useState([]);        // File[]
  const [shotErrors, setShotErrors] = useState([]);
  const [action, setAction] = useState("");
  const [actionValue, setActionValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");

  const ctxBits = [context.asset_label, context.txn_date, context.card_number ? "card •••" + String(context.card_number).slice(-3) : null, context.label].filter(Boolean);
  // Which structured actions apply given this context.
  const applicable = actions.filter((a) =>
    a.scope === "transaction" ? context.transaction_id != null
      : a.scope === "card" ? context.card_number != null
        : true);
  const canStructure = kind === "data_fix" && applicable.length > 0;
  const selDef = applicable.find((a) => a.type === action);
  const guided = PROMPTS[kind];   // undefined for 'question' — free text only

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const errs = [], keep = [];
    for (const f of incoming) {
      const why = screenshotRejection(f);
      if (why) errs.push(why); else keep.push(f);
    }
    const room = MAX_SCREENSHOTS - shots.length;
    if (keep.length > room) errs.push(`Only ${MAX_SCREENSHOTS} images per request — ${keep.length - room} not attached.`);
    setShots([...shots, ...keep.slice(0, Math.max(0, room))]);
    setShotErrors(errs);
  };

  const removeShot = (i) => { setShots(shots.filter((_, n) => n !== i)); setShotErrors([]); };

  const submit = async () => {
    if (!title.trim()) { alert("Give the request a short title."); return; }
    if (guided && !observed.trim()) { alert(guided.observed); return; }
    if (guided && !expected.trim()) { alert(guided.expected); return; }
    if (selDef?.input && !String(actionValue).trim()) { alert("Enter " + (selDef.input.placeholder || "a value") + "."); return; }

    const ctx = { ...context };
    if (canStructure && selDef) {
      ctx.action = { type: selDef.type };
      if (selDef.input) ctx.action.value = selDef.cast ? selDef.cast(actionValue) : actionValue;
    }

    setSaving(true);
    // Upload first — the row carries the paths, so it cannot be written until the
    // objects exist. A failed image does not sink the request: the row still files
    // and the error stays on screen, because a described bug with no screenshot is
    // worth far more than a submit that silently did nothing.
    let paths = [];
    if (shots.length && supabase) {
      setProgress(`Uploading ${shots.length} image${shots.length > 1 ? "s" : ""}…`);
      const res = await uploadScreenshots(supabase, shots);
      paths = res.paths;
      if (res.errors.length) setShotErrors(res.errors);
    }
    setProgress("Sending…");
    const ok = await onSubmit({
      kind,
      title: title.trim(),
      details: details.trim() || null,
      observed_behavior: guided ? observed.trim() : null,
      expected_behavior: guided ? expected.trim() : null,
      screenshot_paths: paths,
      context: ctx,
    });
    setSaving(false);
    setProgress("");
    if (ok) onClose();
  };

  const field = { width: "100%", padding: "8px 10px", fontSize: 13, fontFamily: F, border: "1px solid #e0e0d8", borderRadius: 8, boxSizing: "border-box" };
  const label = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" };
  const hint = { fontSize: 11, color: "#94a3b8", margin: "3px 0 0" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1100 }} />
      {/* maxHeight + overflowY: the guided body is taller than a phone viewport, and
          without these the Send button sits off-screen with no way to reach it. */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(480px, 92vw)", maxHeight: "90vh", overflowY: "auto",
        background: "#fff", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        zIndex: 1110, padding: 20, fontFamily: F, WebkitOverflowScrolling: "touch",
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 4 }}>Request a change</div>
        {ctxBits.length > 0 && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Re: {ctxBits.join(" · ")}</div>}

        <label style={label}>Type</label>
        <div style={{ display: "flex", gap: 6, margin: "6px 0 12px" }}>
          {KINDS.map(([v, lbl]) => (
            <button key={v} onClick={() => { setKind(v); setAction(""); setActionValue(""); }} style={{ flex: 1, padding: "7px 8px", fontSize: 12, fontWeight: 600, fontFamily: F, cursor: "pointer", borderRadius: 8, border: `1px solid ${kind === v ? "#14202a" : "#e0e0d8"}`, background: kind === v ? "#14202a" : "#fff", color: kind === v ? "#fff" : "#64748b" }}>{lbl}</button>
          ))}
        </div>

        <label style={label}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "improvement" ? "e.g. Add a weekly summary email" : "e.g. This value looks wrong"} style={{ ...field, margin: "6px 0 12px" }} />

        {canStructure && (
          <div style={{ margin: "0 0 12px", padding: "10px 12px", background: "#f8fafc", border: "1px solid #e7eff2", borderRadius: 8 }}>
            <label style={{ ...label, color: "#0e4c62" }}>Proposed fix (one-click for the owner)</label>
            <select value={action} onChange={(e) => { setAction(e.target.value); setActionValue(""); }} style={{ ...field, margin: "6px 0 0" }}>
              <option value="">Just describe it below</option>
              {applicable.map((a) => <option key={a.type} value={a.type}>{a.label}</option>)}
            </select>
            {selDef?.input?.kind === "number" && (
              <input type="number" min="0" step="1" value={actionValue} onChange={(e) => setActionValue(e.target.value)} placeholder={selDef.input.placeholder || ""} style={{ ...field, margin: "8px 0 0" }} />
            )}
            {selDef?.input?.kind === "select" && (
              <select value={actionValue} onChange={(e) => setActionValue(e.target.value)} style={{ ...field, margin: "8px 0 0" }}>
                <option value="">{selDef.input.placeholder || "Pick one…"}</option>
                {(selDef.input.options || []).map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
              </select>
            )}
          </div>
        )}

        {guided ? (
          <>
            <label style={label}>{guided.observed}</label>
            <textarea value={observed} onChange={(e) => setObserved(e.target.value)} rows={2} placeholder={guided.observedHint} style={{ ...field, margin: "6px 0 0", resize: "vertical" }} />

            <label style={{ ...label, display: "block", marginTop: 12 }}>{guided.expected}</label>
            <textarea value={expected} onChange={(e) => setExpected(e.target.value)} rows={2} placeholder={guided.expectedHint} style={{ ...field, margin: "6px 0 0", resize: "vertical" }} />

            <label style={{ ...label, display: "block", marginTop: 12 }}>Anything else? (optional)</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} placeholder="What you were doing when it happened, or anything else that helps." style={{ ...field, margin: "6px 0 0", resize: "vertical" }} />
          </>
        ) : (
          <>
            <label style={label}>Your question</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} placeholder="Ask it in your own words." style={{ ...field, margin: "6px 0 0", resize: "vertical" }} />
          </>
        )}

        {/* `accept` lists only the displayable types — the same rule screenshotRejection
            enforces — so the iOS picker greys HEICs out instead of letting one through
            to be rejected after the user already picked it. */}
        {supabase && (
          <>
            <label style={{ ...label, display: "block", marginTop: 14 }}>
              Screenshots (optional, up to {MAX_SCREENSHOTS})
            </label>
            <input
              type="file" accept="image/jpeg,image/png,image/webp" multiple
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
              disabled={shots.length >= MAX_SCREENSHOTS}
              style={{ ...field, margin: "6px 0 0", padding: "7px 8px", fontSize: 12, background: "#fff" }}
            />
            <div style={hint}>On a phone this opens the camera roll.</div>
            {shots.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 0" }}>
                {shots.map((f, i) => (
                  <div key={i} style={{ position: "relative", width: 64, height: 64, borderRadius: 8, overflow: "hidden", border: "1px solid #e0e0d8" }}>
                    <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => removeShot(i)} title={"Remove " + f.name}
                      style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, lineHeight: "16px", textAlign: "center", padding: 0, fontSize: 12, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 9, cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {shotErrors.length > 0 && (
              <div style={{ margin: "8px 0 0", padding: "8px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
                {shotErrors.map((e, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#b91c1c", lineHeight: 1.4 }}>{e}</div>
                ))}
              </div>
            )}
          </>
        )}

        {context.screen && (
          <div style={{ fontSize: 11, color: "#94a3b8", margin: "12px 0 0" }}>
            Filed from <strong style={{ color: "#64748b" }}>{context.screen}</strong> — captured automatically.
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 16 }}>
          {progress && <span style={{ fontSize: 11, color: "#64748b", marginRight: "auto" }}>{progress}</span>}
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 600, color: "#64748b", background: "transparent", border: "1px solid #e0e0d8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: F }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: accent, border: "none", borderRadius: 8, padding: "8px 18px", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1, fontFamily: F }}>{saving ? "Sending…" : "Send request"}</button>
        </div>
      </div>
    </>
  );
}
