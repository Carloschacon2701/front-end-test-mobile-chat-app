import { useState, useEffect, useCallback } from "react";
import {
  loadUserChats,
  createNewChat,
  sendMessageToChat,
  type Message,
  type Chat,
} from "../../database/services/chats";

export function useChatsDb(currentUserId: string | null) {
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  // Load chats for the current user
  useEffect(() => {
    const loadChats = async () => {
      if (!currentUserId) {
        setUserChats([]);
        setLoading(false);
        return;
      }

      try {
        const loadedChats = await loadUserChats(currentUserId);
        setUserChats(loadedChats);
      } catch (error) {
        console.error("Error loading chats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [currentUserId]);

  const createChat = useCallback(
    async (participantIds: string[]) => {
      if (!currentUserId || !participantIds.includes(currentUserId)) {
        return null;
      }

      try {
        const chatId = `chat${Date.now()}`;
        const newChat = await createNewChat(chatId, participantIds);

        if (newChat) {
          setUserChats((prevChats) => [...prevChats, newChat]);
        }

        return newChat;
      } catch (error) {
        console.error("Error creating chat:", error);
        return null;
      }
    },
    [currentUserId]
  );

  const sendMessage = useCallback(
    async (chatId: string, text: string, senderId: string) => {
      if (!text.trim()) return false;

      try {
        const messageId = `msg${Date.now()}`;
        const timestamp = Date.now();

        const newMessage = await sendMessageToChat(
          messageId,
          chatId,
          senderId,
          text,
          timestamp
        );

        if (newMessage) {
          // Update state
          setUserChats((prevChats) => {
            return prevChats.map((chat) => {
              if (chat.id === chatId) {
                return {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  lastMessage: newMessage,
                };
              }
              return chat;
            });
          });

          return true;
        }

        return false;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    },
    []
  );

  return {
    chats: userChats,
    createChat,
    sendMessage,
    loading,
  };
}
