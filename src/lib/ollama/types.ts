/* personal-assistant-thing/src/lib/ollama/types.ts */
// Type definitions for Ollama integration

// Use types compatible with ollama package - use any to work around strict typing
export type OllamaMessage = any;

export type OllamaMessageRole = "user" | "assistant" | "system";

export interface OllamaMessageInput {
  role: OllamaMessageRole;
  content: string;
  toolCalls?: string; // Optional JSON string of tool calls (from database)
}

export interface OllamaResponse {
  content: string;
  generationTimeMs: number;
  toolCalls?: any[]; // Array of tool calls made during the conversation
}

export interface OllamaChunk {
  content?: string;
  thinking?: string;
  toolCalls?: any[];
}

export type MaxPromptLength = "none" | 1024 | 4096 | null;

