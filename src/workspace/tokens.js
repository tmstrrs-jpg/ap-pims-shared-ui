// Copied from ap-pims-pm-portal src/workspace/tokens.js @ ece372b7 (W1, #1037). Shared-ui is now the one copy; change it here.
// W1 workspace tokens: the one place the frame's colours, sizes and motion live. Values are copied from the
// mockup canvas (boards Main, Walkthrough, LiveDispute, Float) and the W1 brief, Part B. Later briefs restyle
// screens INTO the shell; they read these tokens, never copy them.
// Colours are written as hex("RRGGBB"), not as quoted literals: they are the workspace's own (always-dark table,
// warm paper) and must stay out of the Soft-glass dark bridge, which remaps quoted colour literals found in src/
// (scripts/gen-glass-dark-bridge.mjs). They reach the page only as CSS custom properties on the shell.
const hex = (rgb) => `#${rgb}`;

export const WS = Object.freeze({
  table: hex("1F2226"),            // the near-black ground
  tableLift: hex("262A2F"),        // a card or chip resting on the table
  ink: hex("ECEBE6"),              // text on the table
  inkSoft: hex("B9B8B2"),          // secondary text on the table (8.0:1)
  inkFaint: hex("9A9993"),         // tertiary text and placeholders (5.6:1 on the table, 5.0:1 on a chip)
  paper: hex("E8E8E3"),            // a sheet of paper
  paperInk: hex("1E2023"),         // text on paper
  paperInkSoft: hex("4A4C50"),     // secondary text on paper (7.0:1 on paper)
  paperRule: hex("CFCFC8"),        // hairlines on paper
  warn: hex("E3B341"),             // the unset-clock warning on the table
  warnInk: hex("2A2108"),
  late: hex("E5806B"),
  focus: hex("E8E8E3"),
});

// The four bars and their panels. Each panel is a dark shade of its bar's colour.
export const BARS = Object.freeze({
  left:   { key: "index",     label: "Index",     color: hex("7A3E3B"), panel: hex("2C1817") },
  top:    { key: "dashboard", label: "Dashboard", color: hex("9A8546"), panel: hex("2B2716") },
  right:  { key: "job",       label: "This job",  color: hex("3F5A75"), panel: hex("16212C") },
  bottom: { key: "mine",      label: "Mine",      color: hex("4F6E52"), panel: hex("18241A") },
});

export const BAR = Object.freeze({ thick: 14, hover: 24, share: 0.25, hoverMs: 250 });

// Panels slide in over 0.45 s on the canvas curve.
export const EASE_PANEL = "cubic-bezier(.2,.8,.2,1)";
export const PANEL_MS = 450;
// On the phone (W6a UX fix) the panels are a navigation surface opened many times a day: under the ~300 ms ceiling.
export const PANEL_MS_PHONE = 260;

// Unfolding text: each word of an agent reply lands 85-110 ms after the last.
export const WORD_MS_MIN = 85;
export const WORD_MS_MAX = 110;

export const SERIF = "'Newsreader', 'Iowan Old Style', Georgia, serif";
export const SANS = "'Inter', -apple-system, 'Segoe UI', sans-serif";
export const FONT_HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400&display=swap";

// At most two papers open beside the main one; the rest wait as cards.
export const MAX_OPEN_PAPERS = 2;
