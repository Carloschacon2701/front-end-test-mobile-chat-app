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
  (table) => [
    index("chat_participants_user_id_idx").on(table.userId),
    index("chat_participants_chat_id_idx").on(table.chatId),
  ]
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
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [
    index("messages_chat_timestamp_idx").on(table.chatId, table.timestamp),
    index("messages_sender_idx").on(table.senderId),
  ]
);
