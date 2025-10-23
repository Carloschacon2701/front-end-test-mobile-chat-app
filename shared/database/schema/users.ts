import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    avatar: text("avatar").notNull(),
    status: text("status", { enum: ["online", "offline", "away"] }).notNull(),
  },
  (table) => ({
    // Index for finding users by status (for online/offline filtering)
    statusIdx: index("users_status_idx").on(table.status),
    // Index for searching users by name
    nameIdx: index("users_name_idx").on(table.name),
  })
);
