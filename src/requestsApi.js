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

// Screenshot storage. The bucket is private; the "crs upload own folder" policy
// requires the first path segment to be the uploader's auth.uid(), so every path
// this module builds is `<uid>/<file>` and nothing else will insert.
export const SCREENSHOT_BUCKET = 'change-request-screenshots';
export const MAX_SCREENSHOTS = 5;
export const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024; // matches the bucket's file_size_limit

// Kept narrower than the bucket's allowed_mime_types on purpose. The bucket also
// permits image/heic and image/heif so that a non-shared-ui client gets a stored
// object rather than an opaque storage rejection — but a HEIC cannot be rendered
// by any browser, so the field user is told here, at pick time, instead of a PM
// discovering a broken thumbnail days later.
const DISPLAYABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const HEIC = /(^image\/hei[cf]$)|(\.hei[cf]$)/i;

// Returns a human-readable reason this file can't be attached, or null if it's fine.
export function screenshotRejection(file) {
  if (HEIC.test(file.type) || HEIC.test(file.name)) {
    return `"${file.name}" is an iPhone HEIC photo, which no browser can display. ` +
      `Take a screenshot instead, or switch Settings → Camera → Formats → "Most Compatible".`;
  }
  if (!DISPLAYABLE_TYPES.includes(file.type)) {
    return `"${file.name}" is not a JPEG, PNG or WebP image.`;
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return `"${file.name}" is ${(file.size / 1048576).toFixed(1)}MB — the limit is 10MB.`;
  }
  return null;
}

// Uploads each file and returns the storage paths to put on the request row.
// Partial success is real and reported: a request with 2 of 3 images attached is
// far more useful than a failed submit, so callers file the row either way.
export async function uploadScreenshots(supabase, files) {
  if (!files?.length) return { paths: [], errors: [] };
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return { paths: [], errors: ['Not signed in — screenshots could not be uploaded.'] };

  const paths = [], errors = [];
  const stamp = Date.now();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
    // upsert stays false: the bucket has no UPDATE policy, so an overwrite would 403.
    const { error } = await supabase.storage.from(SCREENSHOT_BUCKET)
      .upload(`${uid}/${stamp}-${i}-${safe}`, file, { contentType: file.type, upsert: false });
    if (error) errors.push(`${file.name}: ${error.message}`);
    else paths.push(`${uid}/${stamp}-${i}-${safe}`);
  }
  return { paths, errors };
}

// Private bucket, so a PM needs signed URLs to view what the field filed.
export async function screenshotUrls(supabase, paths, expiresIn = 3600) {
  if (!paths?.length) return [];
  const { data, error } = await supabase.storage.from(SCREENSHOT_BUCKET)
    .createSignedUrls(paths, expiresIn);
  if (error) return [];
  return (data || []).filter((d) => d.signedUrl).map((d) => ({ path: d.path, url: d.signedUrl }));
}

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
export async function submitRequest(supabase, module, payload) {
  const { kind, title, details, context, observed_behavior, expected_behavior, screenshot_paths } = payload;
  const row = { module, kind, title, details, context: context || {} };
  // Only send the guided fields when they carry something. `question` requests
  // legitimately have neither, and screenshot_paths is NOT NULL DEFAULT '{}'.
  if (observed_behavior) row.observed_behavior = observed_behavior;
  if (expected_behavior) row.expected_behavior = expected_behavior;
  if (screenshot_paths?.length) row.screenshot_paths = screenshot_paths;

  const { error } = await supabase.from('change_requests').insert(row);
  if (error) { alert('Could not send request: ' + error.message); return false; }
  return true;
}

// Build a describe(action) fn from a module's action definitions (each carries .describe).
export const makeDescribe = (actions = []) => (a) => {
  if (!a || !a.type) return null;
  const def = actions.find((x) => x.type === a.type);
  return def ? def.describe(a) : null;
};
