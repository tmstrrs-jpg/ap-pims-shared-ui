// Copied from ap-pims-pm-portal src/workspace/deskState.js @ ece372b7 (W1, #1037). Shared-ui is now the one copy; change it here.
// W1 · which papers are open beside the main paper. At most two are open; opening a third puts the oldest open one
// back with the cards. A paper on the second screen is "away" until that window closes. Pure, so it is tested alone.
import { useCallback, useReducer } from "react";
import { MAX_OPEN_PAPERS } from "./tokens.js";

export const emptyDesk = Object.freeze({ open: [], away: null, why: {} });

export function deskReducer(state, action) {
  switch (action.type) {
    case "open": {
      if (!action.id || state.open.includes(action.id)) return action.why ? { ...state, why: { ...state.why, [action.id]: action.why } } : state;
      const open = [...state.open.filter((id) => id !== action.id), action.id];
      while (open.length > MAX_OPEN_PAPERS) open.shift();
      return { ...state, open, away: state.away === action.id ? null : state.away, why: action.why ? { ...state.why, [action.id]: action.why } : state.why };
    }
    case "putBack":
      return { ...state, open: state.open.filter((id) => id !== action.id) };
    case "away":
      return { ...state, open: state.open.filter((id) => id !== action.id), away: action.id };
    case "returned":
      return state.away === action.id || action.id == null ? { ...state, away: null } : state;
    case "reset":
      return emptyDesk;
    default:
      return state;
  }
}

// The desk state, shared by the screen, the chat line (show_paper) and the second screen.
export function usePaperDesk(papers) {
  const [desk, dispatch] = useReducer(deskReducer, emptyDesk);
  const showPaper = useCallback((id, why) => {
    if (!papers.some((p) => p.id === id)) return false;
    dispatch({ type: "open", id, why });
    return true;
  }, [papers]);
  return { desk, dispatch, showPaper };
}
