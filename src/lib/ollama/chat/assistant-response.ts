/* personal-assistant-thing/src/lib/ollama/chat/assistant-response.ts */

import { type Message, type ToolCall } from "ollama";
import { OllamaChat } from "./ollama-chat";
import type { MaxPromptLength, OllamaChunk } from "@/src/lib/ollama/types";
import { createStreamController } from "./stream-controller";
import { setupAbortHandler, isAbortedOrClosed } from "./abort-handler";
import { saveAssistantMessage, saveToolMessage, extractToolCounts } from "./message-persistence";

export interface StreamAssistantResponseParams {
  ollamaMessages: Message[];
  threadId: number;
  threadModel: string | null;
  threadMaxPromptLength: MaxPromptLength;
  signal: AbortSignal;
}

/**
 * Streams assistant response and handles database persistence
 */
export function streamAssistantResponse({
  ollamaMessages,
  threadId,
  threadModel,
  threadMaxPromptLength,
  signal,
}: StreamAssistantResponseParams): ReadableStream<Uint8Array> {
  let accumulatedContent = "";
  const allToolCalls: ToolCall[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      const { safeClose, safeEnqueue, isClosed } = createStreamController(controller);

      try {
        // Check if already aborted
        if (signal.aborted) {
          safeClose();
          return;
        }

        const onChunk = (chunk: OllamaChunk) => {
          // Check abort signal before each chunk
          if (isAbortedOrClosed(signal, isClosed)) {
            return;
          }

          if (chunk.content) {
            accumulatedContent += chunk.content;
            safeEnqueue({ type: "content", content: chunk.content });
          }

          if (chunk.tool_calls) {
            allToolCalls.push(...chunk.tool_calls);
            safeEnqueue({ type: "toolCalls", toolCalls: chunk.tool_calls });
          }
        };

        // Set up abort handler
        const cleanupAbortHandler = setupAbortHandler(signal, () => {
          safeEnqueue({ type: "error", error: "Generation stopped" });
          safeClose();
        });

        let generationTimeMs: number | undefined;

        try {
          const result = await OllamaChat(
            ollamaMessages,
            onChunk,
            threadModel ?? "",
            signal,
            threadMaxPromptLength,
            async (content: string, toolName: string) => {
              const savedMessage = await saveToolMessage({
                threadId,
                content,
                toolName,
              });
              // Stream tool message to frontend
              safeEnqueue({
                type: "toolMessage",
                id: savedMessage.id,
                content: savedMessage.content,
                threadId,
                createdAt: savedMessage.createdAt.toISOString(),
              });
            }
          );
          generationTimeMs = result.generationTimeMs;
        } catch (error) {
          // If aborted, don't throw - just close
          if (signal.aborted || (error instanceof Error && error.message === "Request aborted")) {
            safeClose();
            return;
          }
          throw error;
        } finally {
          cleanupAbortHandler();
        }

        // Helper function to save message and send done event
        const saveAndSendDone = async (genTimeMs: number | null) => {
          await saveAssistantMessage({
            threadId,
            content: accumulatedContent,
            model: threadModel,
            maxPromptLength: threadMaxPromptLength,
            generationTimeMs: genTimeMs,
            toolCallCounts: extractToolCounts(allToolCalls),
          });

          safeEnqueue({
            type: "done",
            answer: accumulatedContent,
            model: threadModel,
            maxPromptLength: threadMaxPromptLength,
            toolCallCounts: extractToolCounts(allToolCalls),
          });
        };

        // Check if aborted before saving
        if (signal.aborted) {
          // Save partial content if any was generated
          if (accumulatedContent) {
            await saveAndSendDone(null);
          }
          safeClose();
          return;
        }

        // Store assistant message with model, maxPromptLength, generation time and tool calls
        await saveAndSendDone(generationTimeMs ?? null);
        safeClose();
      } catch {
        safeEnqueue({ type: "error", error: "Sorry, something went wrong." });
        safeClose();
      }
    },
  });

  return stream;
}
