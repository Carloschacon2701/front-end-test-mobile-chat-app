import { useState, useEffect, useCallback, useMemo } from "react";
import { chatsService, type Message, type Chat } from "../../services/chats";

export function useChatsDb(currentUserId: string | null) {
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [messagePagination, setMessagePagination] = useState<
    Record<string, { offset: number; hasMore: boolean }>
  >({});

  // Load chats for the current user
  useEffect(() => {
    const loadChats = async () => {
      if (!currentUserId) {
        setUserChats([]);
        setLoading(false);
        return;
      }

      try {
        const loadedChats = await chatsService.loadUserChats(currentUserId);
        setUserChats(loadedChats);

        // Initialize pagination state for each chat
        const initialPagination: Record<
          string,
          { offset: number; hasMore: boolean }
        > = {};
        loadedChats.forEach((chat) => {
          initialPagination[chat.id] = {
            offset: chat.messages.length,
            hasMore: chat.messages.length === 50, // Assume more if we got exactly 50
          };
        });
        setMessagePagination(initialPagination);

        // Load unread counts for each chat
        const unreadCountsData: Record<string, number> = {};
        for (const chat of loadedChats) {
          const count = await chatsService.getUnreadMessageCount(
            chat.id,
            currentUserId
          );
          unreadCountsData[chat.id] = count;
        }
        setUnreadCounts(unreadCountsData);
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
        const newChat = await chatsService.createNewChat(
          chatId,
          participantIds
        );

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

  const loadMoreMessages = useCallback(
    async (chatId: string) => {
      const pagination = messagePagination[chatId];
      if (!pagination || !pagination.hasMore) return;

      try {
        const olderMessages = await chatsService.getChatMessagesPaginated(
          chatId,
          pagination.offset,
          50
        );

        if (olderMessages.length > 0) {
          setUserChats((prevChats) => {
            return prevChats.map((chat) => {
              if (chat.id === chatId) {
                return {
                  ...chat,
                  messages: [...olderMessages, ...chat.messages],
                };
              }
              return chat;
            });
          });

          setMessagePagination((prev) => ({
            ...prev,
            [chatId]: {
              offset: pagination.offset + olderMessages.length,
              hasMore: olderMessages.length === 50,
            },
          }));
        } else {
          setMessagePagination((prev) => ({
            ...prev,
            [chatId]: {
              ...pagination,
              hasMore: false,
            },
          }));
        }
      } catch (error) {
        console.error("Error loading more messages:", error);
      }
    },
    [messagePagination]
  );

  const sendMessage = useCallback(
    async (chatId: string, text: string, senderId: string) => {
      if (!text.trim()) return false;

      try {
        const messageId = `msg${Date.now()}`;
        const timestamp = Date.now();

        const newMessage = await chatsService.sendMessageToChat(
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

  // Function to edit a message
  const editMessageInChat = useCallback(
    async (messageId: string, newText: string) => {
      try {
        await chatsService.editMessage(messageId, newText);

        // Update state optimistically
        setUserChats((prevChats) => {
          return prevChats.map((chat) => {
            const updatedMessages = chat.messages.map((message) => {
              if (message.id === messageId) {
                return {
                  ...message,
                  text: newText,
                  isEdited: true,
                };
              }
              return message;
            });

            return {
              ...chat,
              messages: updatedMessages,
              lastMessage:
                chat.lastMessage?.id === messageId
                  ? { ...chat.lastMessage, text: newText, isEdited: true }
                  : chat.lastMessage,
            };
          });
        });

        return true;
      } catch (error) {
        console.error("Error editing message:", error);
        return false;
      }
    },
    []
  );

  // Function to delete a message
  const deleteMessageInChat = useCallback(async (messageId: string) => {
    try {
      await chatsService.deleteMessage(messageId);

      // Update state optimistically
      setUserChats((prevChats) => {
        return prevChats.map((chat) => {
          const updatedMessages = chat.messages.map((message) => {
            if (message.id === messageId) {
              return {
                ...message,
                isDeleted: true,
              };
            }
            return message;
          });

          return {
            ...chat,
            messages: updatedMessages,
          };
        });
      });

      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      return false;
    }
  }, []);

  // Function to refresh unread counts
  const refreshUnreadCounts = useCallback(async () => {
    if (!currentUserId) return;

    const unreadCountsData: Record<string, number> = {};
    for (const chat of userChats) {
      const count = await chatsService.getUnreadMessageCount(
        chat.id,
        currentUserId
      );
      unreadCountsData[chat.id] = count;
    }
    setUnreadCounts(unreadCountsData);
  }, [currentUserId, userChats]);

  // Memoize chats to prevent unnecessary re-renders
  const memoizedChats = useMemo(() => userChats, [userChats]);

  return {
    chats: memoizedChats,
    unreadCounts,
    createChat,
    sendMessage,
    editMessage: editMessageInChat,
    deleteMessage: deleteMessageInChat,
    loadMoreMessages,
    refreshUnreadCounts,
    loading,
  };
}
