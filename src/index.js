// Shared UI for the AP PIMS apps (DJR, Labor, Lookahead, PM Portal).
//
//   import { GlobalCapture } from 'ap-pims-shared-ui';
//   <GlobalCapture supabase={supabase} module="djr" />
//
// The change_requests backend (table, RLS, triage routine, ship-to-deploy
// endpoint) is shared and needs no per-app work. PM Portal keeps its own
// RequestsPanel/triage surface locally — only the capture side is shared.

export { default as GlobalCapture } from "./GlobalCapture";
export { default as RequestModal } from "./RequestModal";
export { loadRequests, submitRequest, makeDescribe, REQUEST_KINDS } from "./requestsApi";
export { F, ACCENT } from "./theme";
