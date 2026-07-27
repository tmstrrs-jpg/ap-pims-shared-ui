// GlobalCapture — a floating "Request a change" button present on every screen.
// Mounted once at the app root (main.jsx), independent of the screen router: it
// checks auth itself and reads the current screen from the URL, so it can capture
// a request from anywhere you're browsing.
//
// Props:
//   supabase  (required) the host app's Supabase client — this package is shared
//             across four apps and cannot import any one app's client module.
//   module    which app is filing, stored in change_requests.module.
//             'portal' | 'djr' | 'labor' | 'lookahead'. No CHECK constrains it.
//   context   optional override for the captured context; defaults to the screen
//             derived from the URL.
//   accent    button/submit colour.
//
// Any signed-in user sees the button. There is deliberately no role gate: the
// live user_profiles.role values are owner / pm / superintendent, so the previous
// ["owner","pm","office"] gate hid this from all four superintendents — i.e. from
// every field user of DJR and Labor — while 'office' matched nobody at all.
// RLS is the real control: the INSERT policy is `requested_by = auth.uid()`, and
// SELECT returns your own rows plus everything for owner/pm.

import { useState, useEffect } from "react";
import { F, ACCENT } from "./theme";
import RequestModal from "./RequestModal";
import { submitRequest } from "./requestsApi";

// PM Portal routes on ?view=; the field apps don't. Fall back to the path so the
// request still records where the user was instead of always saying "home".
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

export default function GlobalCapture({ supabase, module = "portal", context, accent = ACCENT }) {
  const [signedIn, setSignedIn] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let on = true;
    supabase.auth.getUser().then(({ data }) => { if (on) setSignedIn(!!data?.user); });
    // The component mounts at the app root, which in every app is before login.
    // Without this subscription the button would stay hidden until a page reload.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (on) setSignedIn(!!session?.user);
    });
    return () => { on = false; sub?.subscription?.unsubscribe(); };
  }, [supabase]);

  if (!supabase || !signedIn) return null;

  const screen = currentScreen();
  const ctx = context || { screen, label: "Screen: " + screen };

  const submit = async (payload) => {
    const ok = await submitRequest(supabase, module, payload);
    if (ok) window.dispatchEvent(new CustomEvent("pims-request-filed"));
    return ok;
  };

  return (
    <>
      {/* Hidden while the request modal is open — otherwise this fixed z-2500 button sits on top
          of the modal and covers its Submit button ("blocking from submitting", req #12). */}
      {!openModal && (
      <button
        onClick={() => setOpenModal(true)}
        title="Request a change on this screen"
        style={{
          // Bottom-LEFT (not right): the bottom-right corner is where every screen's primary
          // actions live — Payables Approve/Office/Owner/Send-back are inline at the bottom of the
          // invoice pane, plus modal confirm buttons — and this fixed z-2500 button was covering
          // them (req #12). The app shell has no left rail, so the bottom-left corner is clear.
          position: "fixed", left: 18, bottom: 18, zIndex: 2500,
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 14px", fontSize: 13, fontWeight: 700, fontFamily: F,
          color: "#fff", background: accent, border: "none", borderRadius: 24,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)", cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 15 }}>✎</span> Request a change
      </button>
      )}
      {openModal && (
        <RequestModal context={ctx} actions={[]} accent={accent}
          onSubmit={submit} onClose={() => setOpenModal(false)} />
      )}
    </>
  );
}
