// The workspace shell (W1) and its phone pieces (W6a). One copy for every PIMS app; apps never copy it.
// CSS: import 'ap-pims-shared-ui/workspace.css' once (the shell sets its colours as custom properties on .ws-root).
export { default as Shell, CloseIcon } from "./Shell.jsx";
export { default as Paper } from "./Paper.jsx";
export { default as Sheet } from "./Sheet.jsx";
export { default as StatusLine } from "./StatusLine.jsx";
export { WS, BARS, BAR, EASE_PANEL, PANEL_MS, WORD_MS_MIN, WORD_MS_MAX, SERIF, SANS, FONT_HREF, MAX_OPEN_PAPERS } from "./tokens.js";
export { shellStyle, useWorkspaceFonts } from "./shellStyle.js";
export { emptyDesk, deskReducer, usePaperDesk } from "./deskState.js";
export { prefersReducedMotion, wordDelay } from "./unfold.js";
