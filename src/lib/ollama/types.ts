/* personal-assistant-thing/src/lib/ollama/types.ts */
// Type definitions for Ollama integration

export interface OllamaMessage {
  role: "user" | "assistant" | "system" | "tool";
  content?: string;
  thinking?: string;
  tool_calls?: ToolCall[];
  tool_name?: string;
}

export type OllamaMessageRole = "user" | "assistant" | "system";

export interface ToolCall {
  id?: string;
  type?: "function";
  function: {
    name: string;
    arguments: string | { [key: string]: unknown };
  };
}

export interface OllamaMessageInput {
  role: OllamaMessageRole;
  content: string;
  toolCalls?: string; // Optional JSON string of tool calls (from database)
}

export interface OllamaResponse {
  content: string;
  generationTimeMs: number;
  toolCalls?: ToolCall[]; // Array of tool calls made during the conversation
}

export interface OllamaChunk {
  content?: string;
  thinking?: string;
  toolCalls?: ToolCall[];
}

export type MaxPromptLength = "none" | 1024 | 4096 | null;
