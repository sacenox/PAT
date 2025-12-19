/* personal-assistant-thing/src/lib/ollama/index.ts */
// Barrel export file for Ollama integration

export { OllamaChat, streamAssistantResponse } from "./chat";
export type { StreamAssistantResponseParams } from "./chat";
export { getFirstAvailableModel } from "./models";
export type { OllamaChunk, OllamaChatResponse, MaxPromptLength } from "./types";
