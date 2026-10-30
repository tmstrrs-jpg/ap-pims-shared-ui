// W8b · read the person's rooms through the host app's adapter. Read only: no message is loaded, nothing is marked
// read (opening a room is the host's existing Team Chat screen, which keeps its own behaviour).
//   adapter.listRooms()      -> chat_rooms rows the caller's RLS shows (room_id, kind, name, dm_key, ...)
//   adapter.loadDirectory()  -> { [auth user id]: { name } } (optional; a failure only loses DM names)
// The unread summary is NOT read here: each app already holds fn_chat_unread_summary (portal useChatNotifications,
// DJR useChatStatus) and passes it in, so the bar and the list never count twice.
import { useEffect, useState } from "react";

export function useTeamChatRooms({ adapter, enabled = true, reloadKey = 0 }) {
  const [state, setState] = useState({ status: "idle", rooms: [], directory: {} });
  useEffect(() => {
    if (!enabled || !adapter?.listRooms) return undefined;
    let live = true;
    setState((s) => (s.status === "ready" ? s : { ...s, status: "loading" }));
    Promise.all([
      adapter.listRooms(),
      adapter.loadDirectory ? Promise.resolve().then(() => adapter.loadDirectory()).catch(() => ({})) : Promise.resolve({}),
    ]).then(([rooms, directory]) => { if (live) setState({ status: "ready", rooms: rooms || [], directory: directory || {} }); },
      () => { if (live) setState((s) => ({ ...s, status: s.status === "ready" ? "ready" : "error" })); });
    return () => { live = false; };
  }, [adapter, enabled, reloadKey]);
  return state;
}
