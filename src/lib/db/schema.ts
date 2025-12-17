/* personal-assistant-thing/src/lib/db/schema.ts */
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  title: text("title"),
  model: text("model").notNull().default("gpt-oss"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  generationTimeMs: integer("generation_time_ms"), // Time taken to generate response (for assistant messages)
  toolCalls: text("tool_calls"), // JSON string of tool calls made to generate this message (for assistant messages)
});

// Define relations
export const threadsRelations = relations(threads, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
}));

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
