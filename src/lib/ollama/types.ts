/* personal-assistant-thing/src/lib/ollama/types.ts */
// Type definitions for Ollama integration
// We use ollama package types directly where possible, only defining project-specific types here

import type { Message, ToolCall } from "ollama";

// Response type from OllamaChat (includes generation time)
// Based on Message content with additional metadata
export type OllamaChatResponse = Pick<Message, "content"> & {
  generationTimeMs: number;
  toolCalls?: ToolCall[]; // Array of tool calls made during the conversation
};

// Streaming chunk type for onChunk callback
// Based on Message fields for streaming updates (all optional)
export type OllamaChunk = Partial<Pick<Message, "content" | "thinking">> & {
  tool_calls?: ToolCall[];
};

// Project-specific type for max prompt length setting
export type MaxPromptLength = "none" | 1024 | 4096 | null;
