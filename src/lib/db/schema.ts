import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";

export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  title: text("title"),
  model: text("model").notNull(),
  maxPromptLength: integer("max_prompt_length"), // null, 1024, or 4096
  userPrompt: text("user_prompt"), // User-defined prompt to include in system prompt
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
  thinking: text("thinking"), // Thinking (for assistant messages)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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

// Note: Verify that nomic-embed-text produces 768-dimensional embeddings
// If using a different embedding model, adjust the dimensions accordingly
const EMBEDDING_DIMENSIONS = 768;

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("embeddingIndex").using("hnsw", table.embedding.op("vector_cosine_ops"))]
);

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
