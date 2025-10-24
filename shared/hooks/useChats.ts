import { useChatsDb } from "./db/useChatsDb";
import { type Chat } from "../database/services/chats";
import { type Message } from "../database/services/chats";

export { Chat, Message };

export function useChats(currentUserId: string | null) {
  const {
    chats,
    unreadCounts,
    createChat,
    sendMessage,
    editMessage,
    deleteMessage,
    loading,
    loadMoreMessages,
    refreshUnreadCounts,
  } = useChatsDb(currentUserId);

  return {
    chats,
    unreadCounts,
    createChat,
    sendMessage,
    editMessage,
    deleteMessage,
    loading,
    loadMoreMessages,
    refreshUnreadCounts,
  };
}
