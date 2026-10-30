// Copied from ap-pims-pm-portal src/workspace/shellStyle.js @ ece372b7 (W1, #1037). Shared-ui is now the one copy; change it here.
// W1 · the shell's custom properties (all from tokens.js) and the font loader, shared by the shell and the
// paper-only second screen.
import { useEffect } from "react";
import { BAR, EASE_PANEL, FONT_HREF, PANEL_MS, SANS, SERIF, WS } from "./tokens.js";

// The workspace's two faces (Newsreader, Inter) load only when someone with the feature opens it.
export function useWorkspaceFonts() {
  useEffect(() => {
    if (typeof document === "undefined" || document.querySelector("link[data-ws-fonts]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = FONT_HREF; link.dataset.wsFonts = "";
    document.head.appendChild(link);
  }, []);
}

export const shellStyle = Object.freeze({
  "--ws-table": WS.table, "--ws-lift": WS.tableLift, "--ws-ink": WS.ink, "--ws-ink-soft": WS.inkSoft, "--ws-ink-faint": WS.inkFaint,
  "--ws-paper": WS.paper, "--ws-paper-ink": WS.paperInk, "--ws-paper-ink-soft": WS.paperInkSoft, "--ws-paper-rule": WS.paperRule,
  "--ws-warn": WS.warn, "--ws-warn-ink": WS.warnInk, "--ws-late": WS.late, "--ws-focus": WS.focus,
  "--ws-serif": SERIF, "--ws-sans": SANS, "--ws-ease": EASE_PANEL, "--ws-panel-ms": `${PANEL_MS}ms`, "--ws-bar-ms": `${BAR.hoverMs}ms`,
});
