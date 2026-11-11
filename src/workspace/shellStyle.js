// Copied from ap-pims-pm-portal src/workspace/shellStyle.js @ ece372b7 (W1, #1037). Shared-ui is now the one copy; change it here.
// W1 · the shell's custom properties (all from tokens.js) and the font loader, shared by the shell and the
// paper-only second screen.
import { BAR, EASE_PANEL, PANEL_MS, SANS, SERIF, WS } from "./tokens.js";

// The workspace faces (Newsreader, Inter) used to be linked from Google Fonts here, which sent every visitor IP
// address to Google. They are now our own files: the app imports "ap-pims-shared-ui/workspace-fonts.css" from the
// module that opens the workspace (a dynamic import() keeps it out of the main bundle). This hook stays so callers
// need no change; it loads nothing.
export function useWorkspaceFonts() {}

export const shellStyle = Object.freeze({
  "--ws-table": WS.table, "--ws-lift": WS.tableLift, "--ws-ink": WS.ink, "--ws-ink-soft": WS.inkSoft, "--ws-ink-faint": WS.inkFaint,
  "--ws-paper": WS.paper, "--ws-paper-ink": WS.paperInk, "--ws-paper-ink-soft": WS.paperInkSoft, "--ws-paper-rule": WS.paperRule,
  "--ws-warn": WS.warn, "--ws-warn-ink": WS.warnInk, "--ws-late": WS.late, "--ws-focus": WS.focus,
  "--ws-serif": SERIF, "--ws-sans": SANS, "--ws-ease": EASE_PANEL, "--ws-panel-ms": `${PANEL_MS}ms`, "--ws-bar-ms": `${BAR.hoverMs}ms`,
});
