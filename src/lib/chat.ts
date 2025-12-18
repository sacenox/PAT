/* personal-assistant-thing/src/lib/chat.ts */
import { fetchOllamaResponse } from "@/src/lib/ollama";
import type {
  OllamaMessageInput,
  MaxPromptLength,
  ToolCall,
} from "@/src/lib/ollama/types";
import { db } from "@/src/lib/db";
import { messages, threads } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";

export interface StreamAssistantResponseParams {
  ollamaMessages: OllamaMessageInput[];
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Track if controller is closed to avoid double-close
      let isControllerClosed = false;
      const safeClose = () => {
        if (!isControllerClosed) {
          isControllerClosed = true;
          try {
            controller.close();
          } catch {
            // Controller may already be closed, ignore
          }
        }
      };

      const safeEnqueue = (data: Uint8Array) => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(data);
          } catch {
            // Controller may be closed, ignore
          }
        }
      };

      try {
        // Check if already aborted
        if (signal.aborted) {
          safeClose();
          return;
        }

        const onChunk = (chunk: {
          content?: string;
          thinking?: string;
          toolCalls?: ToolCall[];
        }) => {
          // Check abort signal before each chunk
          if (signal.aborted || isControllerClosed) {
            return;
          }

          if (chunk.content) {
            accumulatedContent += chunk.content;
            safeEnqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "content", content: chunk.content })}\n\n`
              )
            );
          }
          if (chunk.thinking) {
            safeEnqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "thinking", thinking: chunk.thinking })}\n\n`
              )
            );
          }
          if (chunk.toolCalls) {
            allToolCalls.push(...chunk.toolCalls);
            safeEnqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "toolCalls", toolCalls: chunk.toolCalls })}\n\n`
              )
            );
          }
        };

        // Set up abort handler
        const abortHandler = () => {
          safeEnqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: "Generation stopped" })}\n\n`
            )
          );
          safeClose();
        };
        signal.addEventListener("abort", abortHandler);

        let generationTimeMs: number | undefined;
        let toolCalls: ToolCall[] | undefined;

        try {
          const result = await fetchOllamaResponse(
            ollamaMessages,
            onChunk,
            threadModel,
            signal,
            threadMaxPromptLength
          );
          generationTimeMs = result.generationTimeMs;
          toolCalls = result.toolCalls;
        } catch (error) {
          // If aborted, don't throw - just close
          if (signal.aborted || (error instanceof Error && error.message === "Request aborted")) {
            safeClose();
            return;
          }
          throw error;
        } finally {
          signal.removeEventListener("abort", abortHandler);
        }

        // Check if aborted before saving
        if (signal.aborted) {
          // Save partial content if any was generated
          if (accumulatedContent) {
            await db.insert(messages).values({
              threadId: threadId,
              role: "assistant",
              content: accumulatedContent,
              model: threadModel,
              maxPromptLength: threadMaxPromptLength === "none" ? null : threadMaxPromptLength, // null means "none" (no limit), otherwise 1024 or 4096
              createdAt: new Date(),
              generationTimeMs: null,
              toolCalls: allToolCalls.length > 0 ? JSON.stringify(allToolCalls) : null,
            });
            await db.update(threads).set({ updatedAt: new Date() }).where(eq(threads.id, threadId));

            // Send done message with metadata for aborted generation
            safeEnqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  answer: accumulatedContent,
                  model: threadModel,
                  maxPromptLength: threadMaxPromptLength,
                })}\n\n`
              )
            );
          }
          safeClose();
          return;
        }

        // Store assistant message with model, maxPromptLength, generation time and tool calls
        await db.insert(messages).values({
          threadId: threadId,
          role: "assistant",
          content: accumulatedContent,
          model: threadModel,
          maxPromptLength: threadMaxPromptLength === "none" ? null : threadMaxPromptLength, // null means "none" (no limit), otherwise 1024 or 4096
          createdAt: new Date(),
          generationTimeMs,
          toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
        });

        // Update thread's updatedAt timestamp
        await db.update(threads).set({ updatedAt: new Date() }).where(eq(threads.id, threadId));

        // Send final message with metadata
        safeEnqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              answer: accumulatedContent,
              model: threadModel,
              maxPromptLength: threadMaxPromptLength,
            })}\n\n`
          )
        );
        safeClose();
      } catch {
        safeEnqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: "Sorry, something went wrong." })}\n\n`
          )
        );
        safeClose();
      }
    },
  });

  return stream;
}
