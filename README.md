# ap-pims-shared-ui

Shared React components for the AP PIMS apps — DJR, Labor Planner, Lookahead, PM Portal.

Public repo on purpose: all four consuming repos are private and Netlify builds them
remotely (`command = "npm run build"`), so a private git dependency would fail to
install on the push-triggered deploy path. Nothing sensitive lives here — no keys,
no PII, no business logic. Only generic UI and the `change_requests` table name.

## Install

Pin a tag. Never track `#main` — an unpinned dependency makes every app's build
depend on whatever landed here most recently.

```bash
npm install github:tmstrrs-jpg/ap-pims-shared-ui#v0.1.0
```

`dist/` is committed, so installing runs no build step.

## `<GlobalCapture />`

Floating "Request a change" button, mounted once at the app root. Writes to
`public.change_requests`.

```jsx
import { GlobalCapture } from 'ap-pims-shared-ui'
import { supabase } from './supabaseClient'

<GlobalCapture supabase={supabase} module="djr" />
```

| Prop | Required | Default | Notes |
|---|---|---|---|
| `supabase` | yes | — | The host app's client. Passed in because this package is shared across four apps and can't import any one app's client module. |
| `module` | no | `"portal"` | Stored in `change_requests.module`. Use `portal` / `djr` / `labor` / `lookahead`. No CHECK constrains it. |
| `context` | no | derived from URL | Defaults to the screen from `?view=`, else the pathname. |
| `accent` | no | `#14202a` | Button and submit colour. |

Visible to **any signed-in user**. There is no client-side role gate: live
`user_profiles.role` values are `owner`, `pm`, `superintendent`, so the original
`["owner","pm","office"]` gate hid the button from all four superintendents — every
field user of DJR and Labor — while `office` matched nobody. Access control is RLS:
INSERT is `requested_by = auth.uid()`; SELECT returns your own rows, plus all rows
for `owner`/`pm`.

## Backend

`public.change_requests` — PK is a **legacy generic `id` (bigint)**, one of the few
PIMS tables where that's correct. `requested_by` defaults to `auth.uid()`; don't set
it explicitly. `kind` is CHECK-constrained to `data_fix` / `improvement` / `question`;
`status` to `open` / `in_review` / `approved` / `preview` / `applied` / `rejected`.

Triage (`RequestsPanel`, `shipViaDeploy`, the `ship-request` Netlify function) stays
local to PM Portal — those depend on portal-only endpoints. Only capture is shared.

## Release

```bash
npm run build
git add -A && git commit -m "..." && git push
git tag v0.1.1 && git push origin v0.1.1
```

Then bump the pinned tag in each consuming app's `package.json`.

## React

Peer dependency `^18.2.0 || ^19.0.0`. The apps span React 18.2 (Labor), 18.3
(Lookahead) and 19.2 (DJR, PM Portal); React is external in the build so no app
ends up with a second copy.

## Soft glass tokens + theme engine (v0.3)

An opt-in look. With the flag off nothing changes: every `--pims-*` variable exists only while `<html data-pims-ui="glass">` is set.

1. Import the CSS once, at the app entry:
   ```js
   import 'ap-pims-shared-ui/tokens.css'
   import 'ap-pims-shared-ui/base.css'
   ```
2. Mount the hook near the app root, with the gate from `fetchUiAllowed` (the `ui_glass` feature wins when present, otherwise only `role === 'owner'`):
   ```js
   import { usePimsUi, fetchUiAllowed } from 'ap-pims-shared-ui'
   const [allowed, setAllowed] = useState(false)
   useEffect(() => { fetchUiAllowed(supabase, role).then(setAllowed) }, [role])
   const ui = usePimsUi({ allowed, themes: ['system', 'light', 'dark'] }) // add 'field' in DJR, Labor, Lookahead
   ```
   On `localhost`, `127.0.0.1` and `deploy-preview-N--*` hosts, `?ui=glass` / `?ui=classic` forces the look. Production hosts ignore it.
3. Put the switcher inside an existing menu or panel (it has no positioning of its own, and renders nothing when `ui.canChoose` is false):
   ```jsx
   import { PimsLookMenu } from 'ap-pims-shared-ui'
   <PimsLookMenu ui={ui} />
   ```
4. Use `pv(name, classic)` for every themed style value. **The fallback must equal the replaced literal, character for character**; numbers become `px`:
   ```js
   import { pv } from 'ap-pims-shared-ui'
   style={{ background: pv('surface', '#fff'), borderRadius: pv('r-btn', 8) }}
   // → var(--pims-surface, #fff) / var(--pims-r-btn, 8px)
   ```
   An unknown token name throws, so typos fail tests.

Run `npm test` for the token scoping and WCAG contrast checks.

Default look: when `allowed` is true and the user has not chosen, the look is Soft glass; a stored choice (including Classic) wins. When `allowed` is false the look is always Classic. The `ui_glass` feature is the release and rollback switch.

## Workspace shell (v0.4, W1 + W6a)

The workspace frame from the PM Portal (W1) now lives here, so the portal and the DJR app share one shell instead
of copying it (W6 Part 0.2). Copied from `ap-pims-pm-portal` `src/workspace/` at `ece372b7`; the only changes are an
inline close icon (no `lucide-react` dependency) and the stylesheet being a separate import.

```js
import { Shell, Paper, Sheet, StatusLine, usePaperDesk } from 'ap-pims-shared-ui';
import 'ap-pims-shared-ui/workspace.css';
```

- `Shell`: four bars (Index, Dashboard, This job, Mine), one panel open at a time, Esc closes, focus returns to the bar.
- `Paper`: a static full-width sheet of paper for the phone (no dragging).
- `Sheet`: a bottom sheet (Esc, tap outside or Close; Tab stays inside; focus returns to the opener; 44 px targets).
- `StatusLine`: one sentence in words with optional actions (`tone`: `calm`, `waiting`, `problem`).
- Tokens (`WS`, `BARS`, ...), `shellStyle`, `usePaperDesk` / `deskReducer` (at most two papers open), `wordDelay`.

Nothing in the apps uses this package copy yet: the DJR app vendors it (`src/vendor/pims-ui/workspace/`) for W6a,
and the portal keeps its own `src/workspace/` until a separate change re-points it. No tag is cut for 0.4.0-rc.1.

## Team Chat room list (v0.5, W8b)

One Team Chat room list for the workspace's Mine panel, used by the PM Portal and the DJR phone (W8 Decision 2), so
one login sees the same rooms in both. Presentational: each app keeps its own Supabase calls and passes an adapter.

```js
import { TeamChatRooms, useTeamChatRooms, mineRooms } from 'ap-pims-shared-ui';
import 'ap-pims-shared-ui/chat.css';

const state = useTeamChatRooms({ adapter: { listRooms, loadDirectory }, enabled: panelOpen });
const rows = mineRooms({ rooms: state.rooms, directory: state.directory, myId, summary });
<TeamChatRooms status={state.status} rows={rows} onOpen={(room) => openTeamChat(room.room_id)} />
```

- `summary` is the app's own `fn_chat_unread_summary` result (`summarize(rows)`); the list never reads it again.
- Read only: no messages are loaded and nothing is marked read. A tap opens the app's existing Team Chat screen on
  that room (the two apps' thread screens differ, so they are re-hosted, not rewritten).
- Agent inboxes ("Your agents") are left out by default (the DJR phone opens the inbox from My agent). The portal,
  whose Team Chat screen lists the inbox, passes `includeAgentInbox: true` and gets the person's own inbox as a row.
  Order: unread first, then company, help, projects, daily reports, DMs.
- The count on the bar and over the list is `mineUnreadTotal(...)`: only what the list shows, so every counted
  message is one tap away. With `rooms` it is the sum of the rows; without (the bar, before the panel opened) it is
  `summary.total` less the unread in `inboxRoomIds`, unless `includeAgentInbox`.
- `Shell` takes an optional `counts` prop (`{ mine: { value, label } }`): a small number beside the bar, read out
  with the bar's name. Nothing shows for 0 or without the prop.
