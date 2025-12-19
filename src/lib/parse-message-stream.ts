import { getParseErrorMessage, handleError } from "@/src/lib/errors";

type StreamEventCallbacks = {
  onContent?: (content: string) => void;
  onToolMessage?: (id: number, threadId: number, content: string, createdAt?: string) => void;
  onDone?: (data: {
    answer?: string;
    model?: string;
    maxPromptLength?: number | null;
    toolCallCounts?: string | null;
  }) => void;
  onError?: (error: string) => void;
  onStop?: () => void;
};

/**
 * Parses a streaming message response from the chat API.
 * Handles Server-Sent Events (SSE) format with different message types.
 *
 * @param reader - ReadableStreamDefaultReader from the fetch response
 * @param callbacks - Callback functions for different event types
 * @param onError - Optional error handler callback
 */
export async function parseMessageStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: StreamEventCallbacks,
  onError?: (error: string) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim() === "") continue;
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "content") {
            accumulatedContent += data.content || "";
            callbacks.onContent?.(accumulatedContent);
          } else if (data.type === "toolMessage") {
            callbacks.onToolMessage?.(data.id, data.threadId, data.content, data.createdAt);
          } else if (data.type === "done") {
            callbacks.onDone?.({
              answer: data.answer,
              model: data.model,
              maxPromptLength: data.maxPromptLength,
              toolCallCounts: data.toolCallCounts,
            });
            return;
          } else if (data.type === "error") {
            if (data.error === "Generation stopped") {
              callbacks.onStop?.();
              return;
            }
            const errorMsg = data.error || "Unknown error";
            callbacks.onError?.(errorMsg);
            if (onError) onError(errorMsg);
            throw new Error(errorMsg);
          }
        } catch (parseError) {
          handleError(parseError, onError);
        }
      }
    }
  }
}

/**
 * Fetches and parses a streaming chat response.
 *
 * @param message - The message to send
 * @param threadId - The thread ID
 * @param callbacks - Callback functions for different event types
 * @param signal - Optional AbortSignal to cancel the request
 * @param onError - Optional error handler callback
 * @throws If the request fails or response is invalid
 */
export async function fetchAndParseMessageStream(
  message: string,
  threadId: number,
  callbacks: StreamEventCallbacks,
  signal?: AbortSignal,
  onError?: (error: string) => void
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message.trim(), threadId }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch((parseError) => {
      throw new Error(getParseErrorMessage(parseError));
    });
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }

  if (!res.body) {
    throw new Error("Response body is null");
  }

  const reader = res.body.getReader();
  await parseMessageStream(reader, callbacks, onError);
}
