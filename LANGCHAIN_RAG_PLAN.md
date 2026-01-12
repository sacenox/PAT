# LangChain RAG Integration Plan

## Overview

This plan outlines the steps to integrate LangChain for implementing a Retrieval-Augmented Generation (RAG) system in the personal assistant application. The RAG system will use `data.txt` as the knowledge base.

## Architecture Decision

**Approach**: Integrate RAG directly into the chat generation flow. For each user message, automatically retrieve relevant context from the knowledge base and inject it into the conversation context before generation. This ensures the LLM always has access to relevant information from `data.txt` without requiring explicit tool calls.

## Implementation Steps

### 1. Install Dependencies

The following LangChain packages are already installed:

- `@langchain/core` - Core LangChain library ✅ (already installed)
- `@langchain/ollama` - Ollama integration for embeddings and LLM ✅ (already installed)
- `@langchain/textsplitters` - Text splitting utilities ✅ (already installed)

Additional requirements:

- `pgvector` extension for PostgreSQL (requires DB migration)
- `tsx` (dev dependency) - For running TypeScript scripts directly ✅ (already installed)

**Note**: `@langchain/community` is NOT needed for this implementation since we're using a custom vector store implementation with pgvector directly, rather than LangChain's built-in vector stores.

### 2. Create RAG Module

**File**: `src/lib/rag.ts`

- Define constants: `EMBEDDING_MODEL`, `CHUNK_COUNT`
- Create embeddings function
- Create functions to store documents and perform similarity search
- Create `retrieveRelevantContext` function with caching
- All RAG functionality in one file

**Code snippet:**

```typescript
import { db } from "@/src/lib/db";
import { documentChunks } from "@/src/lib/db/schema";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Document } from "@langchain/core/documents";
import { cosineDistance, desc, sql } from "drizzle-orm";
import { getCache, setCache } from "@/src/lib/cache";

const EMBEDDING_MODEL = "nomic-embed-text";
const CHUNK_COUNT = 4;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function createEmbeddings(): OllamaEmbeddings {
  return new OllamaEmbeddings({
    model: EMBEDDING_MODEL,
  });
}

export async function storeDocuments(
  documents: Document[],
  embeddings: OllamaEmbeddings
): Promise<void> {
  // Generate embeddings for all chunks
  const texts = documents.map((doc) => doc.pageContent);
  const embeddingsList = await embeddings.embedDocuments(texts);

  // Store in database (Drizzle handles vector type conversion automatically)
  for (let i = 0; i < documents.length; i++) {
    await db.insert(documentChunks).values({
      content: documents[i].pageContent,
      embedding: embeddingsList[i],
      metadata: documents[i].metadata,
    });
  }
}

async function similaritySearch(
  queryEmbedding: number[],
  limit: number
): Promise<Array<{ content: string; metadata: unknown; similarity: number }>> {
  const similarity = sql<number>`1 - (${cosineDistance(documentChunks.embedding, queryEmbedding)})`;

  const results = await db
    .select({
      content: documentChunks.content,
      metadata: documentChunks.metadata,
      similarity,
    })
    .from(documentChunks)
    .orderBy(desc(similarity))
    .limit(limit);

  return results;
}

export async function retrieveRelevantContext(query: string): Promise<string | null> {
  // Check cache first
  const cacheKey = `rag:${query.toLowerCase().trim()}`;
  const cached = await getCache<string>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const embeddings = createEmbeddings();
    const queryEmbedding = await embeddings.embedQuery(query);

    const results = await similaritySearch(queryEmbedding, CHUNK_COUNT);

    if (results.length === 0) {
      return null;
    }

    // Format chunks into context string
    const context = results
      .map((result, index) => `[Chunk ${index + 1}]\n${result.content}`)
      .join("\n\n");

    // Cache the result
    await setCache(cacheKey, context, CACHE_TTL_MS);

    return context;
  } catch (error) {
    console.error("RAG retrieval error:", error);
    return null;
  }
}
```

### 3. Integration into Chat Flow

**File**: `src/lib/chat.ts`

- Modify `generateResponse` function to:
  - Extract the latest user message from message history (last message with role "user")
  - Call `retrieveRelevantContext` with the user message content
  - If context is retrieved, inject it into the message history:
    - Find the position after all system messages but before user messages
    - Insert a system message with formatted RAG context at that position
    - Format: `**Relevant Context from Knowledge Base:**\n\n[formatted chunks]\n\nUse this information to help answer the user's question.`
  - Pass enhanced message history to `agentLoop`
- Ensure RAG context is only injected when relevant chunks are found
- Handle errors gracefully - if RAG retrieval fails, continue without context
- Note: RAG context is retrieved fresh for each generation, based on the latest user message

**Code snippet for `src/lib/chat.ts` modification:**

```typescript
import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { createMessage } from "@/src/lib/messages";
import { retrieveRelevantContext } from "@/src/lib/rag";
import { asc, eq } from "drizzle-orm";

// ... existing type definitions and functions ...

export async function generateResponse(
  threadId: number,
  enqueue: (message: MessageHistoryEntry) => void
) {
  if (!threadId) {
    throw new Error("Thread ID is required");
  }

  // Get the thread:
  const thread = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
  if (thread.length === 0) {
    throw new Error("Thread not found");
  }

  // Get all of the messages for this thread:
  const messagesList = (await db
    .select({
      role: messages.role,
      content: messages.content,
      thinking: messages.thinking,
    })
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt))) as MessageHistory;

  if (messagesList.length === 0) {
    throw new Error("No messages found for this thread");
  }

  // Extract latest user message
  const latestUserMessage = messagesList.filter((msg) => msg.role === "user").pop();

  // Retrieve RAG context if user message exists
  let ragContext: string | null = null;
  if (latestUserMessage) {
    try {
      ragContext = await retrieveRelevantContext(latestUserMessage.content);
    } catch (error) {
      console.error("Failed to retrieve RAG context:", error);
      // Continue without RAG context
    }
  }

  // Inject RAG context into message history
  let enhancedMessageHistory = [...messagesList];
  if (ragContext) {
    // Find position after all system messages
    const lastSystemIndex =
      enhancedMessageHistory
        .map((msg, idx) => (msg.role === "system" ? idx : -1))
        .filter((idx) => idx !== -1)
        .pop() ?? -1;

    const ragSystemMessage: MessageHistoryEntry = {
      role: "system",
      content: `**Relevant Context from Knowledge Base:**\n\n${ragContext}\n\nUse this information to help answer the user's question.`,
    };

    enhancedMessageHistory.splice(lastSystemIndex + 1, 0, ragSystemMessage);
  }

  const messageHistory = await agentLoop(thread[0].model, enhancedMessageHistory, enqueue);

  // Update the thread with the new message history:
  for (const message of messageHistory) {
    await createMessage(message.content, message.role, threadId, message.thinking);
  }
}
```

### 4. Vector Store Initialization

#### 4.1 Initialization Strategy

- Initialization is done via an npm script, not automatically
- Chunking, embedding generation, and vector DB updates happen when the script is run
- Run the script manually after updating `data.txt` or as part of deployment

#### 4.2 Initialization Script

**File**: `scripts/update-vector-data.ts`

- Load `data.txt` file directly
- Split document into chunks using RecursiveCharacterTextSplitter (define `CHUNK_SIZE` and `CHUNK_OVERLAP` constants)
- Generate embeddings for all chunks
- Store all chunks with embeddings in vector database
- Handle errors gracefully
- Optionally clear existing data before re-indexing (add `--force` flag)

**Code snippet:**

```typescript
import { readFile } from "fs/promises";
import { join } from "path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { storeDocuments } from "@/src/lib/rag";
import { db } from "@/src/lib/db";
import { documentChunks } from "@/src/lib/db/schema";
import { count } from "drizzle-orm";

const DATA_FILE_PATH = "./data.txt";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

async function updateVectorData(force: boolean = false): Promise<void> {
  try {
    // Check if documents are already indexed
    const existingCount = await db.select({ count: count() }).from(documentChunks);
    if (existingCount[0].count > 0 && !force) {
      console.log("RAG vector store already initialized. Use --force to re-index.");
      return;
    }

    if (force && existingCount[0].count > 0) {
      console.log("Clearing existing vector data...");
      await db.delete(documentChunks);
    }

    console.log("Loading and chunking data.txt...");

    // Load data.txt file
    const filePath = join(process.cwd(), DATA_FILE_PATH);
    const content = await readFile(filePath, "utf-8");
    const document = new Document({
      pageContent: content,
      metadata: { source: DATA_FILE_PATH },
    });

    // Split document into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });
    const chunks = await textSplitter.splitDocuments([document]);

    console.log(`Generated ${chunks.length} chunks, generating embeddings...`);

    // Generate embeddings for all chunks
    const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text" });
    await storeDocuments(chunks, embeddings);

    console.log("Vector data update complete!");
  } catch (error) {
    console.error("Failed to update vector data:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const force = process.argv.includes("--force");
updateVectorData(force);
```

**NPM Script Entry:**

Add to `package.json`:

```json
{
  "scripts": {
    "rag:update": "tsx scripts/update-vector-data.ts",
    "rag:update:force": "tsx scripts/update-vector-data.ts --force"
  }
}
```

**Note**: `tsx` is already installed as a dev dependency, so no additional installation is needed.

### 5. Database Schema

- Add migration to enable pgvector extension
- Create `document_chunks` table with:
  - `id` (serial)
  - `content` (text)
  - `embedding` (vector type) - using pgvector
  - `metadata` (jsonb) - store chunk index, source file, etc.
  - `created_at` (timestamp)
- Add Drizzle schema definition in `src/lib/db/schema.ts`
- Create index on embedding column for similarity search performance

**Migration Steps:**

1. Create the pgvector extension manually (Drizzle doesn't create extensions automatically):
   - Use `npx drizzle-kit generate --custom` to create an empty migration file
   - Add: `CREATE EXTENSION IF NOT EXISTS vector;`

2. Generate the table migration:
   - Run `npx drizzle-kit generate` to create migration for the `document_chunks` table
   - Drizzle will automatically generate the table and HNSW index based on the schema definition

**Example migration SQL (auto-generated by drizzle-kit):**

```sql
CREATE TABLE IF NOT EXISTS "document_chunks" (
  "id" serial PRIMARY KEY NOT NULL,
  "content" text NOT NULL,
  "embedding" vector(768),
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddingIndex" ON "document_chunks" USING hnsw (embedding vector_cosine_ops);
```

**Code snippet for `src/lib/db/schema.ts`:**

```typescript
import { pgTable, serial, text, timestamp, jsonb, vector, index } from "drizzle-orm/pg-core";

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
```

**Note**: The pgvector extension must be created manually in a migration. Use `npx drizzle-kit generate --custom` to create an empty migration file and add `CREATE EXTENSION IF NOT EXISTS vector;`

### 6. Error Handling

- Handle Ollama connection errors
- Handle embedding generation failures
- Provide fallback behavior when RAG is unavailable

## File Structure

```
src/lib/
├── rag.ts                  # All RAG functionality (embeddings, vector store, retrieval)
└── chat.ts                 # (update to integrate RAG)
scripts/
└── update-vector-data.ts   # Script to update vector database (chunking, embedding, storage)
```

## Implementation Order

1. **Phase 1: Setup**
   - Install dependencies
   - Create RAG directory structure
   - Set up database schema and migrations

2. **Phase 2: Core RAG Components**
   - Create unified RAG module (embeddings, vector store, retrieval)
   - Create initialization script (chunking, embedding, storage)
   - Add npm script to run initialization

3. **Phase 3: Chat Integration**
   - Modify `generateResponse` to retrieve context
   - Inject context into message history
   - Test integration

4. **Phase 4: Optimization**
   - Error handling
   - Performance tuning

5. **Phase 5: Enhancement (Optional)**
   - Add file watching for `data.txt` updates
   - Add re-indexing endpoint/functionality
   - Add monitoring/logging

## Considerations

### Performance

- Embedding generation happens when running the update script (can be slow)
- Vector store is populated manually via npm script, not automatically
- Cache retrieval results by query to avoid redundant searches
- Script checks if vector store is already populated to skip re-indexing (unless `--force` flag is used)

### Context Injection Strategy

- Inject as additional system message with clear formatting
  - Format: "**Relevant Context from Knowledge Base:**\n[chunks]"
  - Pros: Clear separation, easy to identify in logs
  - Cons: May be treated differently by model

### Scalability

- pgvector with PostgreSQL handles larger datasets well
- Consider chunking strategy for very large files
- Monitor query performance and adjust `CHUNK_COUNT` constant as needed

### Model Selection

- Use an embedding model compatible with Ollama
- `nomic-embed-text` is a good default choice

### Data Updates

- `data.txt` is loaded and indexed via the `npm run rag:update` script
- To update the knowledge base: modify `data.txt`, then run `npm run rag:update:force` to re-index
- The script can be run manually or as part of deployment/CI pipeline
