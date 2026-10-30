// Copied from ap-pims-pm-portal src/workspace/unfold.js @ ece372b7 (W1, #1037). Shared-ui is now the one copy; change it here.
// W1 · unfolding-text timing, kept apart from the component so it can be tested alone.
import { WORD_MS_MAX, WORD_MS_MIN } from "./tokens.js";

export function prefersReducedMotion() {
  try { return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true; } catch { return false; }
}

// The delay before word i: spread over 85-110 ms so the rhythm reads as writing, not a ticker.
export const wordDelay = (i) => WORD_MS_MIN + ((i * 7) % (WORD_MS_MAX - WORD_MS_MIN + 1));
