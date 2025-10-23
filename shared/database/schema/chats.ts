import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
});

export const chatParticipants = sqliteTable(
  "chat_participants",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id),
    userId: text("user_id").notNull(),
  },
  (table) => ({
    // Index for finding chats by user
    userIdIdx: index("chat_participants_user_id_idx").on(table.userId),
    // Index for finding participants by chat
    chatIdIdx: index("chat_participants_chat_id_idx").on(table.chatId),
  })
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id),
    senderId: text("sender_id").notNull(),
    text: text("text").notNull(),
    timestamp: integer("timestamp").notNull(),
  },
  (table) => ({
    // Index for finding messages by chat and ordering by timestamp
    chatTimestampIdx: index("messages_chat_timestamp_idx").on(
      table.chatId,
      table.timestamp
    ),
    // Index for finding messages by sender
    senderIdx: index("messages_sender_idx").on(table.senderId),
  })
);
