/* personal-assistant-thing/src/lib/db/schema.ts */
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  title: text("title"),
  model: text("model").notNull().default("gpt-oss"),
  maxPromptLength: integer("max_prompt_length"), // null, 1024, or 4096
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
  model: text("model"), // Model used to generate this message (for assistant messages)
  maxPromptLength: integer("max_prompt_length"), // Prompt size used to generate this message (for assistant messages) - null, 1024, or 4096
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  generationTimeMs: integer("generation_time_ms"), // Time taken to generate response (for assistant messages)
  toolCallCounts: text("tool_call_counts"), // JSON string of tool name counts, e.g. {"query_weather": 2, "query_web_search": 1}
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
