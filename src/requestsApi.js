// Shared data layer for the in-app change-request queue (any app, any module).
// One general table (public.change_requests) with a `module` column; RLS scopes
// visibility (requesters see own, owner/pm see + resolve all).
//
// Unlike the PM-Portal-local copy this lives in a package that has no idea which
// app it is running in, so the Supabase client is passed in rather than imported.

// public.change_requests.kind is CHECK-constrained to exactly these three values.
// Anything else is a 400 at insert time.
export const REQUEST_KINDS = [
  ['data_fix', 'Data fix'],
  ['improvement', 'Improvement'],
  ['question', 'Question'],
];

export async function loadRequests(supabase, module) {
  const { data, error } = await supabase
    .from('change_requests').select('*').eq('module', module)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// `requested_by` is deliberately not set here — the column defaults to auth.uid(),
// and the INSERT policy checks `requested_by = auth.uid()`. Sending it explicitly
// only creates a way to get it wrong.
export async function submitRequest(supabase, module, { kind, title, details, context }) {
  const { error } = await supabase
    .from('change_requests').insert({ module, kind, title, details, context: context || {} });
  if (error) { alert('Could not send request: ' + error.message); return false; }
  return true;
}

// Build a describe(action) fn from a module's action definitions (each carries .describe).
export const makeDescribe = (actions = []) => (a) => {
  if (!a || !a.type) return null;
  const def = actions.find((x) => x.type === a.type);
  return def ? def.describe(a) : null;
};
