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

// Tool call format required by ollama.chat() - arguments must be an object
export interface OllamaChatToolCall {
  id?: string;
  type?: "function";
  function: {
    name: string;
    arguments: { [key: string]: unknown };
  };
}

// Message format required by ollama.chat() - content is required and tool_calls use OllamaChatToolCall
export interface OllamaChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  thinking?: string;
  tool_calls?: OllamaChatToolCall[];
  tool_name?: string;
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
