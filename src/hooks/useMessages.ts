import { useState, useEffect, useCallback, useRef } from "react";
import type { Message } from "@/src/lib/db/schema";
import { handleError } from "@/src/lib/errors";
import { useMessageDisplaySettings } from "./useMessageDisplaySettings";
import { useFetch } from "./useFetch";
import {
  createUserMessage,
  createAssistantMessage,
  createToolMessage,
  createSystemMessage,
} from "@/src/lib/message-helpers";
import { fetchAndParseMessageStream } from "@/src/lib/parse-message-stream";

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
  const [messageDisplaySettings] = useMessageDisplaySettings();
  const fetchWithErrorHandling = useFetch();

  const loadMessages = useCallback(
    async (id: number, onError?: (error: string) => void) => {
      setIsLoadingMessages(true);
      try {
        const optionalRoles: string[] = [];
        if (messageDisplaySettings.showSystemMessages) {
          optionalRoles.push("system");
        }
        if (messageDisplaySettings.showToolMessages) {
          optionalRoles.push("tool");
        }

        let url = `/api/threads/${id}/messages`;
        if (optionalRoles.length > 0) {
          url += `?optional_roles=${optionalRoles.join(",")}`;
        }

        const data = await fetchWithErrorHandling<{ messages: Message[] }>(url, {
          errorMessage: "Failed to load messages",
          onError,
        });
        if (data) {
          const loadedMessages = data.messages || [];
          setMessages(loadedMessages);
        }
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [
      messageDisplaySettings.showSystemMessages,
      messageDisplaySettings.showToolMessages,
      fetchWithErrorHandling,
    ]
  );

  const updateAssistantMessage = (
    messageId: number,
    content: string,
    metadata?: {
      model?: string | null;
      maxPromptLength?: number | null;
      toolCallCounts?: string | null;
    }
  ) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content,
              model: metadata?.model ?? msg.model,
              maxPromptLength: metadata?.maxPromptLength ?? msg.maxPromptLength,
              toolCallCounts: metadata?.toolCallCounts ?? msg.toolCallCounts,
            }
          : msg
      )
    );
  };

  const handleTitleGeneration = async (
    threadId: number,
    threadModel: string,
    onUpdateThreadTitle?: (threadId: number, title: string) => Promise<void>
  ) => {
    if (!onUpdateThreadTitle) return;

    try {
      const titleRes = await fetch(`/api/threads/${threadId}/title`, {
        method: "POST",
      });
      if (titleRes.ok) {
        const titleData = await titleRes.json();
        if (titleData.title) {
          await onUpdateThreadTitle(threadId, titleData.title);
        }
      }
    } catch {
      // Silently fail title generation - don't interrupt the flow
    }
  };

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

  // Reload messages when display settings change (if we have a thread selected)
  // Use JSON.stringify to create a stable dependency key from the settings object
  const settingsKey = JSON.stringify(messageDisplaySettings);
  const prevSettingsKeyRef = useRef<string>(settingsKey);

  useEffect(() => {
    if (settingsKey !== prevSettingsKeyRef.current) {
      prevSettingsKeyRef.current = settingsKey;
      if (threadId !== null && sendingToThreadIdRef.current !== threadId) {
        loadMessages(threadId, onError);
      }
    }
  }, [settingsKey, threadId, loadMessages, onError]);

  const sendMessage = async (
    message: string,
    currentThreadId: number | null,
    onCreateThread: (
      title?: string,
      firstMessage?: string
    ) => Promise<{
      threadId: number;
      systemMessage?: { id: number; content: string; createdAt: string };
    } | null>,
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
      const threadResult = await onCreateThread(message.substring(0, 100), message);
      if (!threadResult) {
        setIsLoading(false);
        if (onError) {
          onError("Failed to create thread");
        }
        return;
      }
      targetThreadId = threadResult.threadId;

      // Add system message to state if it was returned and setting is enabled
      if (threadResult.systemMessage && messageDisplaySettings.showSystemMessages) {
        addSystemMessage(
          threadResult.systemMessage.id,
          targetThreadId,
          threadResult.systemMessage.content,
          threadResult.systemMessage.createdAt
        );
      }

      // Mark that we're sending to this thread before selecting it
      sendingToThreadIdRef.current = targetThreadId;
      onThreadSelect(targetThreadId);
    } else {
      sendingToThreadIdRef.current = targetThreadId;
    }

    const userMsg = createUserMessage(message, targetThreadId);
    setMessages((prev) => [...prev, userMsg]);

    const assistantMsgId = Date.now() + 1;
    setStreamingMessageId(assistantMsgId);

    abortControllerRef.current = new AbortController();
    let messageAdded = false;
    let accumulatedContent = "";

    try {
      await fetchAndParseMessageStream(
        message,
        targetThreadId,
        {
          onContent: (content) => {
            accumulatedContent = content;
            if (!messageAdded && accumulatedContent.trim()) {
              const botMsg = createAssistantMessage(
                assistantMsgId,
                targetThreadId,
                accumulatedContent
              );
              setMessages((prev) => [...prev, botMsg]);
              messageAdded = true;
            } else if (messageAdded) {
              updateAssistantMessage(assistantMsgId, accumulatedContent);
            }
          },
          onToolMessage: (id, threadId, content, createdAt) => {
            const toolMsg = createToolMessage(id, threadId, content, createdAt);
            setMessages((prev) => [...prev, toolMsg]);
          },
          onDone: async (data) => {
            const finalContent = data.answer || accumulatedContent;
            const metadata = {
              model: data.model || null,
              maxPromptLength: data.maxPromptLength !== undefined ? data.maxPromptLength : null,
              toolCallCounts: data.toolCallCounts !== undefined ? data.toolCallCounts : null,
            };

            if (!messageAdded) {
              const botMsg = createAssistantMessage(
                assistantMsgId,
                targetThreadId,
                finalContent,
                metadata
              );
              setMessages((prev) => [...prev, botMsg]);
            } else {
              updateAssistantMessage(assistantMsgId, finalContent, metadata);
            }
            setStreamingMessageId(null);

            const previousUserMessages = messages.filter(
              (m) => m.role === "user" && m.threadId === targetThreadId
            );
            const previousAssistantMessages = messages.filter(
              (m) => m.role === "assistant" && m.threadId === targetThreadId
            );

            const totalUserMessages = previousUserMessages.length + 1;
            const totalAssistantMessages = previousAssistantMessages.length + 1;

            if (
              totalUserMessages === 1 &&
              totalAssistantMessages === 1 &&
              onUpdateThreadTitle &&
              data.model
            ) {
              await handleTitleGeneration(targetThreadId, data.model, onUpdateThreadTitle);
            }
          },
          onStop: () => {
            if (!messageAdded && accumulatedContent.trim()) {
              const botMsg = createAssistantMessage(
                assistantMsgId,
                targetThreadId,
                accumulatedContent
              );
              setMessages((prev) => [...prev, botMsg]);
            }
            setStreamingMessageId(null);
          },
          onError: (errorMsg) => {
            if (onError) onError(errorMsg);
          },
        },
        abortControllerRef.current.signal,
        onError
      );

      onThreadsReload();
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
        handleError(error, onError);
      }
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
    const result = await fetchWithErrorHandling(`/api/threads/${threadId}/messages/${messageId}`, {
      method: "DELETE",
      errorMessage: "Failed to delete message",
      onError,
    });
    if (result !== null) {
      // Remove the message from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    }
  };

  const addSystemMessage = (
    id: number,
    threadId: number,
    content: string,
    createdAt?: string | Date
  ) => {
    const systemMsg = createSystemMessage(id, threadId, content, createdAt);
    setMessages((prev) => {
      // Check if message already exists to avoid duplicates
      if (prev.some((msg) => msg.id === id)) {
        return prev;
      }
      return [...prev, systemMsg];
    });
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
    addSystemMessage,
  };
}
