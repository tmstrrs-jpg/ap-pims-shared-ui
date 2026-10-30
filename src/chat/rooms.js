// W8b · Team Chat rooms, the shared half (Decision 2: one Team Chat for the PM Portal and the DJR phone).
// Pure: keys, labels, ordering and the unread summary. Ported from the DJR app's src/lib/chat/rooms.mjs, which is
// itself the portal's src/lib/chatPoll.js + chatNotify.js. Each app keeps its own Supabase calls (an adapter, see
// useTeamChatRooms); this file never touches a client, so both apps answer "which rooms" the same way.

export function dmKey(a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}:${y}`;
}

// A person's agent inbox ("Your agents"): a DM whose dm_key names the same person twice. The DJR phone opens it
// from My agent (its Team Chat badge leaves it out), so its Mine list skips it. The portal's Team Chat screen lists
// it as a room (its sidebar badge counts it), so the portal's Mine list shows it as a row (includeAgentInbox).
export const selfInboxKey = (uid) => `${uid}:${uid}`;

export function isAgentInbox(room) {
  if (room?.kind !== "dm") return false;
  const [a, b] = String(room.dm_key || "").split(":");
  return !!a && a === b;
}

export function dmCounterpart(key, myId) {
  if (!key) return "";
  const [a, b] = String(key).split(":");
  return a === String(myId) ? b : a;
}

// directory: { [auth user id]: { name } } (v_chat_directory in both apps).
export function dmNamesFor(rooms, directory, myId) {
  return Object.fromEntries((rooms || []).filter((r) => r.kind === "dm").map((r) => [r.room_id,
    isAgentInbox(r) ? (r.name || "Your agents") : (directory?.[dmCounterpart(r.dm_key, myId)]?.name || "Direct message")]));
}

const KIND_LABEL = { company: "Company", help: "Help", project: "Project", djr: "Daily report", dm: "Direct message", preview: "Feature preview" };
export function roomLabel(room, dmNames = {}) {
  if (!room) return "";
  if (room.kind === "dm") return dmNames?.[room.room_id] || room.name || "Direct message";
  return room.name || KIND_LABEL[room.kind] || "Room";
}

// Company, Help, projects (by name), DJR threads (newest first: names start "DJR <date>"), DMs (by name), the rest.
export function orderRooms(rooms, dmNames = {}) {
  const rank = { company: 0, help: 1, project: 2, djr: 3, dm: 4 };
  const label = (r) => roomLabel(r, dmNames);
  const byLabel = (a, b) => (a.kind === "djr" ? label(b).localeCompare(label(a)) : label(a).localeCompare(label(b)));
  return [...(rooms || [])].sort((a, b) => ((rank[a.kind] ?? 9) - (rank[b.kind] ?? 9)) || byLabel(a, b) || String(a.room_id).localeCompare(String(b.room_id)));
}

// fn_chat_unread_summary rows -> { byRoom, total, mentions }. `total` is the sum of every row's unread, agent inbox
// included (the portal's sidebar "Team Chat" badge). The Mine bar uses mineUnreadTotal, not this.
export function summarize(rows) {
  const byRoom = {};
  let total = 0, mentions = 0;
  for (const r of rows || []) {
    const unread = Number(r.unread) || 0, m = Number(r.mentions) || 0;
    byRoom[r.room_id] = { unread, mentions: m, last_message_at: r.last_message_at ?? null };
    total += unread; mentions += m;
  }
  return { byRoom, total, mentions };
}

export const unreadTotal = (summary) => Math.max(0, Number(summary?.total) || 0);

// The Mine panel's list: every readable room except agent inboxes, labelled and ordered the same way in both apps,
// rooms with unread messages first (in that same order). With includeAgentInbox, the person's own inbox (dm_key
// myId:myId; never anyone else's, and none when myId is unknown) is listed too, as "Your agents".
// Rows: { room_id, kind, label, unread, mentions }.
export function mineRooms({ rooms, directory = {}, myId = null, summary = null, includeAgentInbox = false }) {
  const listed = (rooms || []).filter((r) => r && r.room_id && (!isAgentInbox(r)
    || (includeAgentInbox && myId != null && r.dm_key === selfInboxKey(myId))));
  const names = dmNamesFor(listed, directory, myId);
  const rows = orderRooms(listed, names).map((r) => ({
    room_id: r.room_id, kind: r.kind, label: roomLabel(r, names),
    unread: summary?.byRoom?.[r.room_id]?.unread || 0, mentions: summary?.byRoom?.[r.room_id]?.mentions || 0,
  }));
  return [...rows.filter((r) => r.unread > 0), ...rows.filter((r) => !(r.unread > 0))];
}

// The number on the Mine bar and over its list: only what the list shows, so every counted message can be opened
// from the panel. With `rooms` (the list is loaded): the sum of mineRooms' rows, same options. Without (the bar,
// before the panel ever opened): summary.total less the agent inboxes named in inboxRoomIds, unless the list
// includes the inbox (includeAgentInbox, the portal). Never below 0.
export function mineUnreadTotal({ summary, rooms = null, myId = null, includeAgentInbox = false, inboxRoomIds = [] }) {
  if (!summary) return 0;
  if (Array.isArray(rooms)) {
    return mineRooms({ rooms, myId, summary, includeAgentInbox }).reduce((n, r) => n + (Number(r.unread) || 0), 0);
  }
  const skip = includeAgentInbox ? 0 : [...new Set((inboxRoomIds || []).filter(Boolean))]
    .reduce((n, id) => n + (Number(summary.byRoom?.[id]?.unread) || 0), 0);
  return Math.max(0, unreadTotal(summary) - skip);
}
