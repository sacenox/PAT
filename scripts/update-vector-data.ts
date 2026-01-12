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
