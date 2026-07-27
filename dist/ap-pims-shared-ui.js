import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
const F = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const ACCENT = "#14202a";
const REQUEST_KINDS = [
  ["data_fix", "Data fix"],
  ["improvement", "Improvement"],
  ["question", "Question"]
];
async function loadRequests(supabase, module) {
  const { data, error } = await supabase.from("change_requests").select("*").eq("module", module).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
async function submitRequest(supabase, module, { kind, title, details, context }) {
  const { error } = await supabase.from("change_requests").insert({ module, kind, title, details, context: context || {} });
  if (error) {
    alert("Could not send request: " + error.message);
    return false;
  }
  return true;
}
const makeDescribe = (actions = []) => (a) => {
  if (!a || !a.type) return null;
  const def = actions.find((x) => x.type === a.type);
  return def ? def.describe(a) : null;
};
function RequestModal({ context = {}, actions = [], onSubmit, onClose, accent = "#0e4c62" }) {
  var _a, _b;
  const [kind, setKind] = useState("data_fix");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [action, setAction] = useState("");
  const [actionValue, setActionValue] = useState("");
  const [saving, setSaving] = useState(false);
  const ctxBits = [context.asset_label, context.txn_date, context.card_number ? "card •••" + String(context.card_number).slice(-3) : null, context.label].filter(Boolean);
  const applicable = actions.filter((a) => a.scope === "transaction" ? context.transaction_id != null : a.scope === "card" ? context.card_number != null : true);
  const canStructure = kind === "data_fix" && applicable.length > 0;
  const selDef = applicable.find((a) => a.type === action);
  const submit = async () => {
    if (!title.trim()) {
      alert("Give the request a short title.");
      return;
    }
    if ((selDef == null ? void 0 : selDef.input) && !String(actionValue).trim()) {
      alert("Enter " + (selDef.input.placeholder || "a value") + ".");
      return;
    }
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1100 } }),
    /* @__PURE__ */ jsxs("div", { style: { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(480px, 92vw)", background: "#fff", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.2)", zIndex: 1110, padding: 20, fontFamily: F }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 4 }, children: "Request a change" }),
      ctxBits.length > 0 && /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: "#64748b", marginBottom: 12 }, children: [
        "Re: ",
        ctxBits.join(" · ")
      ] }),
      /* @__PURE__ */ jsx("label", { style: label, children: "Type" }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, margin: "6px 0 12px" }, children: REQUEST_KINDS.map(([v, lbl]) => /* @__PURE__ */ jsx("button", { onClick: () => {
        setKind(v);
        setAction("");
        setActionValue("");
      }, style: { flex: 1, padding: "7px 8px", fontSize: 12, fontWeight: 600, fontFamily: F, cursor: "pointer", borderRadius: 8, border: `1px solid ${kind === v ? "#14202a" : "#e0e0d8"}`, background: kind === v ? "#14202a" : "#fff", color: kind === v ? "#fff" : "#64748b" }, children: lbl }, v)) }),
      /* @__PURE__ */ jsx("label", { style: label, children: "Title" }),
      /* @__PURE__ */ jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: kind === "improvement" ? "e.g. Add a weekly summary email" : "e.g. This value looks wrong", style: { ...field, margin: "6px 0 12px" } }),
      canStructure && /* @__PURE__ */ jsxs("div", { style: { margin: "0 0 12px", padding: "10px 12px", background: "#f8fafc", border: "1px solid #e7eff2", borderRadius: 8 }, children: [
        /* @__PURE__ */ jsx("label", { style: { ...label, color: "#0e4c62" }, children: "Proposed fix (one-click for the owner)" }),
        /* @__PURE__ */ jsxs("select", { value: action, onChange: (e) => {
          setAction(e.target.value);
          setActionValue("");
        }, style: { ...field, margin: "6px 0 0" }, children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Just describe it below" }),
          applicable.map((a) => /* @__PURE__ */ jsx("option", { value: a.type, children: a.label }, a.type))
        ] }),
        ((_a = selDef == null ? void 0 : selDef.input) == null ? void 0 : _a.kind) === "number" && /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "1", value: actionValue, onChange: (e) => setActionValue(e.target.value), placeholder: selDef.input.placeholder || "", style: { ...field, margin: "8px 0 0" } }),
        ((_b = selDef == null ? void 0 : selDef.input) == null ? void 0 : _b.kind) === "select" && /* @__PURE__ */ jsxs("select", { value: actionValue, onChange: (e) => setActionValue(e.target.value), style: { ...field, margin: "8px 0 0" }, children: [
          /* @__PURE__ */ jsx("option", { value: "", children: selDef.input.placeholder || "Pick one…" }),
          (selDef.input.options || []).map(([v, lbl]) => /* @__PURE__ */ jsx("option", { value: v, children: lbl }, v))
        ] })
      ] }),
      /* @__PURE__ */ jsx("label", { style: label, children: "Details" }),
      /* @__PURE__ */ jsx("textarea", { value: details, onChange: (e) => setDetails(e.target.value), rows: 4, placeholder: "What should change, and what it should be.", style: { ...field, margin: "6px 0 16px", resize: "vertical" } }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
        /* @__PURE__ */ jsx("button", { onClick: onClose, style: { fontSize: 13, fontWeight: 600, color: "#64748b", background: "transparent", border: "1px solid #e0e0d8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: F }, children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { onClick: submit, disabled: saving, style: { fontSize: 13, fontWeight: 700, color: "#fff", background: accent, border: "none", borderRadius: 8, padding: "8px 18px", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1, fontFamily: F }, children: saving ? "Sending…" : "Send request" })
      ] })
    ] })
  ] });
}
function currentScreen() {
  try {
    const url = new URL(window.location);
    const view = url.searchParams.get("view") || url.searchParams.get("screen");
    if (view) return view;
    const path = url.pathname.replace(/^\/+|\/+$/g, "");
    return path || "home";
  } catch {
    return "home";
  }
}
function GlobalCapture({ supabase, module = "portal", context, accent = ACCENT }) {
  const [signedIn, setSignedIn] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let on = true;
    supabase.auth.getUser().then(({ data }) => {
      if (on) setSignedIn(!!(data == null ? void 0 : data.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (on) setSignedIn(!!(session == null ? void 0 : session.user));
    });
    return () => {
      var _a;
      on = false;
      (_a = sub == null ? void 0 : sub.subscription) == null ? void 0 : _a.unsubscribe();
    };
  }, [supabase]);
  if (!supabase || !signedIn) return null;
  const screen = currentScreen();
  const ctx = context || { screen, label: "Screen: " + screen };
  const submit = async (payload) => {
    const ok = await submitRequest(supabase, module, payload);
    if (ok) window.dispatchEvent(new CustomEvent("pims-request-filed"));
    return ok;
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    !openModal && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpenModal(true),
        title: "Request a change on this screen",
        style: {
          // Bottom-LEFT (not right): the bottom-right corner is where every screen's primary
          // actions live — Payables Approve/Office/Owner/Send-back are inline at the bottom of the
          // invoice pane, plus modal confirm buttons — and this fixed z-2500 button was covering
          // them (req #12). The app shell has no left rail, so the bottom-left corner is clear.
          position: "fixed",
          left: 18,
          bottom: 18,
          zIndex: 2500,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: F,
          color: "#fff",
          background: accent,
          border: "none",
          borderRadius: 24,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          cursor: "pointer"
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 15 }, children: "✎" }),
          " Request a change"
        ]
      }
    ),
    openModal && /* @__PURE__ */ jsx(
      RequestModal,
      {
        context: ctx,
        actions: [],
        accent,
        onSubmit: submit,
        onClose: () => setOpenModal(false)
      }
    )
  ] });
}
export {
  ACCENT,
  F,
  GlobalCapture,
  REQUEST_KINDS,
  RequestModal,
  loadRequests,
  makeDescribe,
  submitRequest
};
