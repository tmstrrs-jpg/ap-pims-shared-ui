// W8b · the Team Chat room list with unread counts, as the workspace's Mine panel shows it in the PM Portal and on
// the DJR phone. Presentational: rows come from mineRooms(), a tap hands the room to the host (which opens its own
// Team Chat screen on that room). Styles: 'ap-pims-shared-ui/chat.css' (workspace tokens, inside .ws-root).
export const MINE_ROOMS_SHOWN = 8;

export default function TeamChatRooms({ status = "ready", rows = [], onOpen, onOpenAll = null, max = MINE_ROOMS_SHOWN, testId = "mine-chat-rooms" }) {
  if (status === "idle" || status === "loading") return <p className="ws-chat-note" data-testid={`${testId}-loading`}>Reading your rooms…</p>;
  if (status === "error") return <p className="ws-chat-note" data-testid={`${testId}-error`}>Your rooms could not be read just now.</p>;
  if (!rows.length) return <p className="ws-chat-note" data-testid={`${testId}-empty`}>No rooms yet.</p>;
  const shown = rows.slice(0, max);
  return (
    <>
      <ul className="ws-chat-rooms" data-testid={testId}>
        {shown.map((r) => (
          <li key={r.room_id}>
            <button type="button" className="ws-chat-room" data-room-id={r.room_id} data-unread={r.unread > 0 || undefined} onClick={() => onOpen?.(r)}
              aria-label={r.unread > 0 ? `${r.label}, ${r.unread} unread` : r.label}>
              <span className="ws-chat-room-name">{r.label}</span>
              {r.unread > 0 && <span className="ws-chat-unread" aria-hidden="true">{r.unread > 99 ? "99+" : r.unread}</span>}
            </button>
          </li>
        ))}
      </ul>
      {rows.length > shown.length && onOpenAll && (
        <button type="button" className="ws-link ws-chat-more" onClick={onOpenAll}>All {rows.length} rooms in Team Chat</button>
      )}
    </>
  );
}
