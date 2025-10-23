import { db } from "../db";
import { chats, chatParticipants, messages } from "../schema";
import { eq } from "drizzle-orm";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
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

/**
 * Get all chat IDs where the user is a participant
 */
export async function getUserChatIds(userId: string): Promise<string[]> {
  const participantRows = await db
    .select()
    .from(chatParticipants)
    .where(eq(chatParticipants.userId, userId));

  return participantRows.map((row) => row.chatId);
}

/**
 * Get chat data by ID
 */
export async function getChatById(chatId: string): Promise<ChatData | null> {
  const chatData = await db.select().from(chats).where(eq(chats.id, chatId));

  return chatData.length > 0 ? chatData[0] : null;
}

/**
 * Get all participants for a chat
 */
export async function getChatParticipants(chatId: string): Promise<string[]> {
  const participantsData = await db
    .select()
    .from(chatParticipants)
    .where(eq(chatParticipants.chatId, chatId));

  return participantsData.map((p) => p.userId);
}

/**
 * Get all messages for a chat, ordered by timestamp
 */
export async function getChatMessages(chatId: string): Promise<Message[]> {
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
  }));
}

/**
 * Get recent messages for a chat (for initial load)
 */
export async function getRecentMessages(
  chatId: string,
  limit: number = 50
): Promise<Message[]> {
  const messagesData = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.timestamp)
    .limit(limit);

  return messagesData.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    text: m.text,
    timestamp: m.timestamp,
  }));
}

/**
 * Get paginated messages for a chat
 */
export async function getChatMessagesPaginated(
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
  }));
}

/**
 * Load all chats for a user with their recent messages and participants
 */
export async function loadUserChats(userId: string): Promise<Chat[]> {
  // Get chat IDs where the user is a participant
  const chatIds = await getUserChatIds(userId);

  if (chatIds.length === 0) {
    return [];
  }

  // Build the complete chat objects
  const loadedChats: Chat[] = [];

  for (const chatId of chatIds) {
    // Get the chat
    const chatData = await getChatById(chatId);
    if (!chatData) continue;

    // Get participants
    const participantIds = await getChatParticipants(chatId);

    // Get only recent messages (last 50) for performance
    const chatMessages = await getRecentMessages(chatId, 50);

    // Determine last message
    const lastMessage =
      chatMessages.length > 0
        ? chatMessages[chatMessages.length - 1]
        : undefined;

    loadedChats.push({
      id: chatId,
      participants: participantIds,
      messages: chatMessages,
      lastMessage,
    });
  }

  return loadedChats;
}

/**
 * Create a new chat with participants
 */
export async function createNewChat(
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

/**
 * Send a message to a chat
 */
export async function sendMessageToChat(
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

    const newMessage: Message = {
      id: messageId,
      senderId,
      text,
      timestamp,
    };

    return newMessage;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}
