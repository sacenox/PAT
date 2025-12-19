import { useState, useEffect, useCallback, useRef } from "react";
import type { Message } from "@/src/lib/db/schema";

/**
 * Custom hook for managing messages within a thread.
 * Handles loading, sending, streaming, and deleting messages.
 *
 * @param threadId - The current thread ID or null if no thread is selected
 * @param onError - Optional error callback function
 * @param onUpdateThreadTitle - Optional callback for updating thread title after first response
 * @returns Object containing:
 *   - `messages` - Array of messages in the current thread
 *   - `isLoading` - Whether a message is currently being sent/generated
 *   - `isLoadingMessages` - Whether messages are being loaded from the server
 *   - `streamingMessageId` - ID of the message currently being streamed, or null
 *   - `sendMessage` - Function to send a new message
 *   - `clearMessages` - Function to clear all messages from state
 *   - `stopGeneration` - Function to stop the current message generation
 *   - `deleteMessage` - Function to delete a specific message
 */
export function useMessages(
  threadId: number | null,
  onError?: (error: string) => void,
  onUpdateThreadTitle?: (threadId: number, title: string) => Promise<void>
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const sendingToThreadIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(async (id: number, onError?: (error: string) => void) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/threads/${id}/messages`);
      if (!res.ok) {
        throw new Error(`Failed to load messages: ${res.status}`);
      }
      const data = await res.json();
      const loadedMessages = data.messages || [];
      setMessages(loadedMessages);
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error.message);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (threadId !== null) {
      // Don't reload messages if we're currently sending a message to this thread (to preserve optimistic updates)
      if (sendingToThreadIdRef.current !== threadId) {
        loadMessages(threadId, onError);
      }
    } else {
      setMessages([]);
      setIsLoadingMessages(false);
    }
  }, [threadId, loadMessages, onError]);

  const sendMessage = async (
    message: string,
    currentThreadId: number | null,
    onCreateThread: (title?: string, firstMessage?: string) => Promise<number | null>,
    onThreadSelect: (id: number) => void,
    onThreadsReload: () => void,
    onError?: (error: string) => void
  ) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    let targetThreadId = currentThreadId;

    if (!targetThreadId) {
      // Create a new thread if none exists
      // The onCreateThread callback should already have model and maxPromptLength
      targetThreadId = await onCreateThread(message.substring(0, 100), message);
      if (!targetThreadId) {
        setIsLoading(false);
        if (onError) {
          onError("Failed to create thread");
        }
        return;
      }
      // Mark that we're sending to this thread before selecting it
      sendingToThreadIdRef.current = targetThreadId;
      onThreadSelect(targetThreadId);
    } else {
      sendingToThreadIdRef.current = targetThreadId;
    }

    const userMsg: Message = {
      id: Date.now(),
      threadId: targetThreadId,
      role: "user",
      content: message,
      createdAt: new Date(),
      model: null,
      maxPromptLength: null,
      generationTimeMs: null,
      toolCallCounts: null,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Create assistant message placeholder (but don't add it yet - wait for content)
    const assistantMsgId = Date.now() + 1;
    setStreamingMessageId(assistantMsgId);

    // Create AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), threadId: targetThreadId }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch((parseError) => {
          throw new Error(
            `Failed to parse error response: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
          );
        });
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("Response body is null");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";
      let shouldStop = false;
      let messageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === "") continue; // Skip empty lines
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "content") {
                accumulatedContent += data.content || "";
                // Only add the message when we have content
                if (!messageAdded && accumulatedContent.trim()) {
                  const botMsg: Message = {
                    id: assistantMsgId,
                    threadId: targetThreadId,
                    role: "assistant",
                    content: accumulatedContent,
                    createdAt: new Date(),
                    model: null,
                    maxPromptLength: null,
                    generationTimeMs: null,
                    toolCallCounts: null,
                  };
                  setMessages((prev) => [...prev, botMsg]);
                  messageAdded = true;
                } else if (messageAdded) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg
                    )
                  );
                }
              } else if (data.type === "done") {
                // Final update with complete answer and metadata
                // If message wasn't added yet (no content received), add it now
                if (!messageAdded) {
                  const botMsg: Message = {
                    id: assistantMsgId,
                    threadId: targetThreadId,
                    role: "assistant",
                    content: data.answer || accumulatedContent,
                    createdAt: new Date(),
                    model: data.model || null,
                    maxPromptLength:
                      data.maxPromptLength !== undefined ? data.maxPromptLength : null,
                    generationTimeMs: null,
                    toolCallCounts: data.toolCallCounts !== undefined ? data.toolCallCounts : null,
                  };
                  setMessages((prev) => [...prev, botMsg]);
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? {
                            ...msg,
                            content: data.answer || accumulatedContent,
                            model: data.model || msg.model,
                            maxPromptLength:
                              data.maxPromptLength !== undefined
                                ? data.maxPromptLength
                                : msg.maxPromptLength,
                            toolCallCounts:
                              data.toolCallCounts !== undefined
                                ? data.toolCallCounts
                                : msg.toolCallCounts,
                          }
                        : msg
                    )
                  );
                }
                setStreamingMessageId(null);

                // Generate title after first assistant response
                // Check if this is the first response (exactly 1 user message and 1 assistant message, excluding system messages)
                const previousUserMessages = messages.filter(
                  (m) => m.role === "user" && m.threadId === targetThreadId
                );
                const previousAssistantMessages = messages.filter(
                  (m) => m.role === "assistant" && m.threadId === targetThreadId
                );

                // After this response, we'll have: previous user messages + this user message, and previous assistant messages + this assistant message
                const totalUserMessages = previousUserMessages.length + 1;
                const totalAssistantMessages = previousAssistantMessages.length + 1;

                if (
                  totalUserMessages === 1 &&
                  totalAssistantMessages === 1 &&
                  onUpdateThreadTitle &&
                  data.model
                ) {
                  // This is the first response, generate a title
                  const threadModel = data.model;

                  if (threadModel) {
                    try {
                      const titleRes = await fetch(`/api/threads/${targetThreadId}/title`, {
                        method: "POST",
                      });
                      if (titleRes.ok) {
                        const titleData = await titleRes.json();
                        if (titleData.title) {
                          await onUpdateThreadTitle(targetThreadId, titleData.title);
                        }
                      }
                    } catch {
                      // Silently fail title generation - don't interrupt the flow
                    }
                  }
                }

                shouldStop = true;
                break;
              } else if (data.type === "error") {
                // If it's a stop error, keep the partial content
                // Note: metadata will be sent via "done" message after the message is saved
                if (data.error === "Generation stopped") {
                  // If we have content but message wasn't added, add it now
                  if (!messageAdded && accumulatedContent.trim()) {
                    const botMsg: Message = {
                      id: assistantMsgId,
                      threadId: targetThreadId,
                      role: "assistant",
                      content: accumulatedContent,
                      createdAt: new Date(),
                      model: null,
                      maxPromptLength: null,
                      generationTimeMs: null,
                      toolCallCounts: null,
                    };
                    setMessages((prev) => [...prev, botMsg]);
                  }
                  setStreamingMessageId(null);
                  shouldStop = true;
                  break;
                }
                const errorMsg = data.error || "Unknown error";
                if (onError) onError(errorMsg);
                throw new Error(errorMsg);
              }
            } catch (parseError) {
              if (onError && parseError instanceof Error) {
                onError(parseError.message);
              }
            }
          }
        }
        if (shouldStop) break;
      }

      // Reload threads to update the order
      onThreadsReload();
    } catch (error) {
      // Don't log abort errors as they're intentional
      if (error instanceof Error && error.name !== "AbortError") {
        // Only remove the assistant message on non-abort errors (if it was added)
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
        if (onError && error instanceof Error) {
          onError(error.message);
        }
      }
      // For abort errors, keep the partial content (message will be added if it has content)
      setStreamingMessageId(null);
    } finally {
      setIsLoading(false);
      sendingToThreadIdRef.current = null;
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const deleteMessage = async (
    messageId: number,
    threadId: number,
    onError?: (error: string) => void
  ) => {
    try {
      const res = await fetch(`/api/threads/${threadId}/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json().catch((parseError) => {
          throw new Error(
            `Failed to parse error response: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
          );
        });
        throw new Error(errorData.error || "Failed to delete message");
      }
      // Remove the message from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error.message);
      }
    }
  };

  return {
    messages,
    isLoading,
    isLoadingMessages,
    streamingMessageId,
    sendMessage,
    clearMessages,
    stopGeneration,
    deleteMessage,
  };
}
