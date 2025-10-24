import { useChatsDb } from "./useChatsDb";
import { type Chat } from "../../services/chats";
import { type Message } from "../../services/chats";

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
