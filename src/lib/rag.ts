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
