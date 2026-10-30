// W8b · one Team Chat room list for every PIMS app (Decision 2). CSS: import 'ap-pims-shared-ui/chat.css' once.
export { default as TeamChatRooms, MINE_ROOMS_SHOWN } from "./TeamChatRooms.jsx";
export { useTeamChatRooms } from "./useTeamChatRooms.js";
export { dmKey, selfInboxKey, isAgentInbox, dmCounterpart, dmNamesFor, roomLabel, orderRooms, summarize, unreadTotal, mineRooms } from "./rooms.js";
