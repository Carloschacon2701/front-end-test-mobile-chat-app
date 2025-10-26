import { db } from "../database/db";
import { chats, chatParticipants, messages, users } from "../database/schema";
import { eq, desc, and, inArray, sql, not } from "drizzle-orm";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
  isDeleted: boolean;
  isEdited: boolean;
  mediaUrl?: string;
  mediaType?: string;
  thumbnailUrl?: string;
}

export interface Chat {
  id: string;
  participants: {
    id: string | null;
    name: string | null;
  }[];
  messages: Message[];
  lastMessage?: Message;
  offset: number;
  hasMore: boolean;
}

export interface ChatListItemType {
  id: string;
  participants: {
    id: string | null;
    name: string | null;
    avatar: string | null;
    status: "online" | "offline" | "away" | null;
  }[];
  lastMessage?: Message;
  unreadCount: number;
}

/**
 * Optimized ChatsService with better performance and reduced database calls
 */
export class ChatsService {
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
   * Optimized method to load user chats following the working pattern from chats.ts
   * Uses the same approach but with better caching
   */
  async getChatList(
    userId: string,
    filter: string
  ): Promise<ChatListItemType[]> {
    const cacheKey = `user_chats_${userId}_${filter}`;
    const cached = this.getCachedResult<ChatListItemType[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get chat IDs where the user is a participant, ordered by last message timestamp
    const chatIdsWithLastMessage = await db
      .select({
        chatId: chatParticipants.chatId,
      })
      .from(chatParticipants)
      .leftJoin(messages, eq(chatParticipants.chatId, messages.chatId))
      .where(eq(chatParticipants.userId, userId))
      .groupBy(chatParticipants.chatId)
      .orderBy(desc(sql`COALESCE(MAX(${messages.timestamp}), 0)`));

    if (chatIdsWithLastMessage.length === 0) {
      return [];
    }

    const chatIds = chatIdsWithLastMessage.map((row) => row.chatId);

    // // Batch fetch all participants for all chats at once
    // const allParticipants = await db
    //   .select()
    //   .from(chatParticipants)
    //   .where(inArray(chatParticipants.chatId, chatIds));

    // // Group participants by chatId
    // const participantsByChat = allParticipants.reduce((acc, participant) => {
    //   if (!acc[participant.chatId]) {
    //     acc[participant.chatId] = [];
    //   }
    //   acc[participant.chatId].push(participant.userId);
    //   return acc;
    // }, {} as Record<string, string[]>);

    // For each chat, get the recent messages using the optimized function
    const loadedChats: ChatListItemType[] = [];
    for (const chatId of chatIds) {
      const participants = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          status: users.status,
        })
        .from(chatParticipants)
        .leftJoin(users, eq(chatParticipants.userId, users.id))
        .where(eq(chatParticipants.chatId, chatId));

      // Always get the last message without filter for the chat preview
      const lastMessageData = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.timestamp))
        .limit(1);

      const lastMessage =
        lastMessageData.length > 0
          ? {
              id: lastMessageData[0].id,
              senderId: lastMessageData[0].senderId,
              text: lastMessageData[0].text,
              timestamp: lastMessageData[0].timestamp,
              isRead: lastMessageData[0].isRead,
              isDeleted: lastMessageData[0].isDeleted,
              isEdited: lastMessageData[0].isEdited,
              mediaUrl: lastMessageData[0].mediaUrl || undefined,
              mediaType: lastMessageData[0].mediaType || undefined,
              thumbnailUrl: lastMessageData[0].thumbnailUrl || undefined,
            }
          : undefined;

      const unreadCount = await this.getUnreadMessageCount(chatId, userId);

      loadedChats.push({
        id: chatId,
        participants: participants,
        lastMessage,
        unreadCount,
      });
    }

    this.setCachedResult(cacheKey, loadedChats);
    return loadedChats;
  }

  async getChat(chatId: string): Promise<Chat> {
    const cached = this.getCachedResult<Chat>(`chat_${chatId}`);
    if (cached) {
      return cached;
    }

    const messagesData = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.timestamp);

    const participantsData = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(chatParticipants)
      .leftJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatId, chatId));

    if (messagesData.length === 0) {
      throw new Error(`Chat ${chatId} not found`);
    }

    const chat = {
      id: messagesData[0].chatId,
      participants: participantsData,
      messages: messagesData.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        text: m.text,
        timestamp: m.timestamp,
        isRead: m.isRead,
        isDeleted: m.isDeleted,
        isEdited: m.isEdited,
      })),
      offset: 0,
      hasMore: false,
    };

    return chat;
  }

  /**
   * Batch operation to get unread counts for multiple chats
   */
  async getUnreadCountsForChats(
    chatIds: string[],
    userId: string
  ): Promise<Record<string, number>> {
    if (chatIds.length === 0) return {};

    const result = await db
      .select({
        chatId: messages.chatId,
        count: sql<number>`count(*)`,
      })
      .from(messages)
      .where(
        and(
          inArray(messages.chatId, chatIds),
          eq(messages.isRead, false),
          not(eq(messages.senderId, userId))
        )
      )
      .groupBy(messages.chatId);

    return result.reduce((acc, row) => {
      acc[row.chatId] = row.count;
      return acc;
    }, {} as Record<string, number>);
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
    this.queryCache.clear();
  }

  async sendMessageToChat(
    chatId: string,
    senderId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: string,
    thumbnailUrl?: string
  ): Promise<Message | null> {
    try {
      const messageId = `msg${Date.now()}`;
      const timestamp = Date.now();

      // Insert new message
      await db.insert(messages).values({
        id: messageId,
        chatId: chatId,
        senderId: senderId,
        text: text,
        timestamp: timestamp,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        thumbnailUrl: thumbnailUrl,
      });

      // Invalidate all caches
      this.invalidateCache(chatId);
      this.queryCache.clear();

      const newMessage: Message = {
        id: messageId,
        senderId,
        text,
        timestamp,
        isRead: false,
        isDeleted: false,
        isEdited: false,
        mediaUrl,
        mediaType,
        thumbnailUrl,
      };

      return newMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      return null;
    }
  }

  async sendMediaMessage(
    chatId: string,
    senderId: string,
    text: string,
    mediaUrl: string,
    mediaType: string,
    thumbnailUrl: string
  ): Promise<Message | null> {
    return this.sendMessageToChat(
      chatId,
      senderId,
      text,
      mediaUrl,
      mediaType,
      thumbnailUrl
    );
  }

  async editMessage(messageId: string, text: string): Promise<void> {
    await db
      .update(messages)
      .set({ text: text, isEdited: true })
      .where(eq(messages.id, messageId));
    this.queryCache.clear();
  }

  async deleteMessage(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isDeleted: true })
      .where(eq(messages.id, messageId));
    this.queryCache.clear();
  }

  async createNewChat(
    currentUserId: string,
    participantIds: string[]
  ): Promise<string | null> {
    try {
      if (!currentUserId || !participantIds.includes(currentUserId)) {
        return null;
      }

      const chatId = `chat${Date.now()}`;
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

      this.invalidateCache(`user_chats_${currentUserId}`);

      return chatId;
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    await db.delete(chats).where(eq(chats.id, chatId));
    await db
      .delete(chatParticipants)
      .where(eq(chatParticipants.chatId, chatId));
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
}

// Export singleton instance
export const chatsService = new ChatsService();
