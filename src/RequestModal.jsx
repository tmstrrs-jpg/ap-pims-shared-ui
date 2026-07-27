// Generic "Request a change" submit form. Module-agnostic: pass an `actions`
// config (module-specific structured one-click fixes) and a `context`. Free-text
// requests need no config; structured actions render from the config's input spec.
//
// actions: [{ type, label, scope: 'transaction'|'card'|'any',
//             input: null | {kind:'number'|'select', placeholder, options?:[[v,label]]},
//             cast?: (v)=>any, describe: (action)=>string }]

import { useState } from "react";
import { F } from "./theme";
import { REQUEST_KINDS as KINDS } from "./requestsApi";

export default function RequestModal({ context = {}, actions = [], onSubmit, onClose, accent = "#0e4c62" }) {
  const [kind, setKind] = useState("data_fix");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [action, setAction] = useState("");
  const [actionValue, setActionValue] = useState("");
  const [saving, setSaving] = useState(false);

  const ctxBits = [context.asset_label, context.txn_date, context.card_number ? "card •••" + String(context.card_number).slice(-3) : null, context.label].filter(Boolean);
  // Which structured actions apply given this context.
  const applicable = actions.filter((a) =>
    a.scope === "transaction" ? context.transaction_id != null
      : a.scope === "card" ? context.card_number != null
        : true);
  const canStructure = kind === "data_fix" && applicable.length > 0;
  const selDef = applicable.find((a) => a.type === action);

  const submit = async () => {
    if (!title.trim()) { alert("Give the request a short title."); return; }
    if (selDef?.input && !String(actionValue).trim()) { alert("Enter " + (selDef.input.placeholder || "a value") + "."); return; }
    const ctx = { ...context };
    if (canStructure && selDef) {
      ctx.action = { type: selDef.type };
      if (selDef.input) ctx.action.value = selDef.cast ? selDef.cast(actionValue) : actionValue;
    }
    setSaving(true);
    const ok = await onSubmit({ kind, title: title.trim(), details: details.trim() || null, context: ctx });
    setSaving(false);
    if (ok) onClose();
  };

  const field = { width: "100%", padding: "8px 10px", fontSize: 13, fontFamily: F, border: "1px solid #e0e0d8", borderRadius: 8, boxSizing: "border-box" };
  const label = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1100 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(480px, 92vw)", background: "#fff", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.2)", zIndex: 1110, padding: 20, fontFamily: F }}>
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
        <label style={label}>Details</label>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} placeholder="What should change, and what it should be." style={{ ...field, margin: "6px 0 16px", resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 600, color: "#64748b", background: "transparent", border: "1px solid #e0e0d8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: F }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: accent, border: "none", borderRadius: 8, padding: "8px 18px", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1, fontFamily: F }}>{saving ? "Sending…" : "Send request"}</button>
        </div>
      </div>
    </>
  );
}
