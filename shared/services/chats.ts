import { db } from "../database/db";
import { chats, chatParticipants, messages } from "../database/schema";
import { eq, desc, and, inArray, sql, not } from "drizzle-orm";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
  isDeleted: boolean;
  isEdited: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
}

export interface ChatData {
  id: string;
}

export interface MessageData {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export class ChatsService {
  // Simple in-memory cache for query results
  private queryCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds cache TTL

  private getCachedResult<T>(key: string): T | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    this.queryCache.delete(key);
    return null;
  }

  private setCachedResult<T>(key: string, data: T): void {
    this.queryCache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Get all chat IDs where the user is a participant
   * Cached for 30 seconds to avoid repeated queries
   */
  async getUserChatIds(userId: string): Promise<string[]> {
    const cacheKey = `user_chats_${userId}`;
    const cached = this.getCachedResult<string[]>(cacheKey);
    if (cached) return cached;

    const participantRows = await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId));

    const chatIds = participantRows.map((row) => row.chatId);
    this.setCachedResult(cacheKey, chatIds);
    return chatIds;
  }

  /**
   * Get chat data by ID
   */
  async getChatById(chatId: string): Promise<ChatData | null> {
    const chatData = await db.select().from(chats).where(eq(chats.id, chatId));

    return chatData.length > 0 ? chatData[0] : null;
  }

  /**
   * Get all participants for a chat
   */
  async getChatParticipants(chatId: string): Promise<string[]> {
    const participantsData = await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.chatId, chatId));

    return participantsData.map((p) => p.userId);
  }

  /**
   * Get all messages for a chat, ordered by timestamp
   */
  async getChatMessages(chatId: string): Promise<Message[]> {
    const messagesData = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.timestamp);

    return messagesData.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      text: m.text,
      timestamp: m.timestamp,
      isRead: m.isRead,
      isDeleted: m.isDeleted,
      isEdited: m.isEdited,
    }));
  }

  /**
   * Get recent messages for a chat (for initial load)
   * Gets the most recent messages in chronological order (oldest first)
   * Uses a more efficient approach with proper offset calculation
   */
  async getRecentMessages(
    chatId: string,
    limit: number = 50
  ): Promise<Message[]> {
    // Get total message count for this chat
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.chatId, chatId));

    const total = totalCount[0]?.count || 0;

    // If we have fewer messages than the limit, just get all messages
    if (total <= limit) {
      const messagesData = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.timestamp);

      return messagesData.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        text: m.text,
        timestamp: m.timestamp,
        isRead: m.isRead,
        isDeleted: m.isDeleted,
        isEdited: m.isEdited,
      }));
    }

    // Otherwise, get the last 'limit' messages using offset
    const offset = total - limit;
    const messagesData = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.timestamp)
      .offset(offset)
      .limit(limit);

    return messagesData.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      text: m.text,
      timestamp: m.timestamp,
      isRead: m.isRead,
      isDeleted: m.isDeleted,
      isEdited: m.isEdited,
    }));
  }

  /**
   * Get paginated messages for a chat
   */
  async getChatMessagesPaginated(
    chatId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<Message[]> {
    const messagesData = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.timestamp)
      .offset(offset)
      .limit(limit);

    return messagesData.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      text: m.text,
      timestamp: m.timestamp,
      isRead: m.isRead,
      isDeleted: m.isDeleted,
      isEdited: m.isEdited,
    }));
  }

  /**
   * Load all chats for a user with their recent messages and participants
   * Optimized with batch queries to reduce N+1 problem
   */
  async loadUserChats(userId: string): Promise<Chat[]> {
    // Get chat IDs where the user is a participant
    const chatIds = await this.getUserChatIds(userId);

    if (chatIds.length === 0) {
      return [];
    }

    // Batch fetch all participants for all chats at once
    const allParticipants = await db
      .select()
      .from(chatParticipants)
      .where(inArray(chatParticipants.chatId, chatIds));

    // Group participants by chatId
    const participantsByChat = allParticipants.reduce((acc, participant) => {
      if (!acc[participant.chatId]) {
        acc[participant.chatId] = [];
      }
      acc[participant.chatId].push(participant.userId);
      return acc;
    }, {} as Record<string, string[]>);

    // For each chat, get the recent messages using the optimized function
    const loadedChats: Chat[] = [];
    for (const chatId of chatIds) {
      const chatMessages = await this.getRecentMessages(chatId, 50);

      const lastMessage =
        chatMessages.length > 0
          ? chatMessages[chatMessages.length - 1]
          : undefined;

      loadedChats.push({
        id: chatId,
        participants: participantsByChat[chatId] || [],
        messages: chatMessages,
        lastMessage,
      });
    }

    return loadedChats;
  }

  /**
   * Create a new chat with participants
   */
  async createNewChat(
    chatId: string,
    participantIds: string[]
  ): Promise<Chat | null> {
    try {
      // Insert new chat
      await db.insert(chats).values({
        id: chatId,
      });

      // Insert participants
      for (const userId of participantIds) {
        await db.insert(chatParticipants).values({
          id: `cp-${chatId}-${userId}`,
          chatId: chatId,
          userId: userId,
        });
      }

      const newChat: Chat = {
        id: chatId,
        participants: participantIds,
        messages: [],
      };

      return newChat;
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
    }
  }

  async markMessagesAsRead(
    chatId: string,
    currentUserId: string
  ): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.chatId, chatId),
          eq(messages.isRead, false),
          not(eq(messages.senderId, currentUserId))
        )
      );
    this.invalidateCache(`chat_${chatId}`);
  }

  /**
   * Get unread message count for a specific chat
   */
  async getUnreadMessageCount(
    chatId: string,
    currentUserId: string
  ): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          eq(messages.isRead, false),
          not(eq(messages.senderId, currentUserId))
        )
      );

    return result[0]?.count || 0;
  }

  /**
   * Get total unread message count for a user across all chats
   */
  async getTotalUnreadMessageCount(userId: string): Promise<number> {
    const chatIds = await this.getUserChatIds(userId);

    if (chatIds.length === 0) {
      return 0;
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          inArray(messages.chatId, chatIds),
          eq(messages.isRead, false),
          not(eq(messages.senderId, userId))
        )
      );

    return result[0]?.count || 0;
  }

  /**
   * Send a message to a chat
   */
  async sendMessageToChat(
    messageId: string,
    chatId: string,
    senderId: string,
    text: string,
    timestamp: number
  ): Promise<Message | null> {
    try {
      // Insert new message
      await db.insert(messages).values({
        id: messageId,
        chatId: chatId,
        senderId: senderId,
        text: text,
        timestamp: timestamp,
      });

      // Invalidate cache for this chat
      this.invalidateCache(`chat_${chatId}`);

      const newMessage: Message = {
        id: messageId,
        senderId,
        text,
        timestamp,
        isRead: false,
        isDeleted: false,
        isEdited: false,
      };

      return newMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      return null;
    }
  }

  async editMessage(messageId: string, text: string): Promise<void> {
    await db
      .update(messages)
      .set({ text: text, isEdited: true })
      .where(eq(messages.id, messageId));
    this.invalidateCache(`chat_${messageId}`);
  }

  async deleteMessage(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isDeleted: true })
      .where(eq(messages.id, messageId));
    this.invalidateCache(`chat_${messageId}`);
  }
}

// Export a singleton instance for backward compatibility
export const chatsService = new ChatsService();
