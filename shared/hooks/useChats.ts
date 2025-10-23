import { useChatsDb } from "./db/useChatsDb";
import { type Chat } from "../database/services/chats";
import { type Message } from "../database/services/chats";

export { Chat, Message };

export function useChats(currentUserId: string | null) {
  const { chats, createChat, sendMessage, loading, loadMoreMessages } =
    useChatsDb(currentUserId);

  return {
    chats,
    createChat,
    sendMessage,
    loading,
    loadMoreMessages,
  };
}
