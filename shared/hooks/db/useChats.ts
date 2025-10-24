import { useChatsDb } from "./useChatsDb";

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
