import { useState, useEffect, useCallback, useRef } from "react";
import type { Message } from "@/src/lib/db/schema";

export function useMessages(threadId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const sendingToThreadIdRef = useRef<number | null>(null);

  const loadMessages = useCallback(async (id: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/threads/${id}/messages`);
      const data = await res.json();
      const loadedMessages = data.messages || [];
      setMessages(loadedMessages);
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (threadId !== null) {
      // Don't reload messages if we're currently sending a message to this thread (to preserve optimistic updates)
      if (sendingToThreadIdRef.current !== threadId) {
        loadMessages(threadId);
      }
    } else {
      setMessages([]);
      setIsLoadingMessages(false);
    }
  }, [threadId, loadMessages]);

  const sendMessage = async (
    message: string,
    currentThreadId: number | null,
    onCreateThread: (title?: string, firstMessage?: string) => Promise<number | null>,
    onThreadSelect: (id: number) => void,
    onThreadsReload: () => void
  ) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    let targetThreadId = currentThreadId;

    if (!targetThreadId) {
      // Create a new thread if none exists
      targetThreadId = await onCreateThread(message.substring(0, 100), message);
      if (!targetThreadId) {
        setIsLoading(false);
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
      generationTimeMs: null,
      toolCalls: null,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Create assistant message placeholder
    const assistantMsgId = Date.now() + 1;
    const botMsg: Message = {
      id: assistantMsgId,
      threadId: targetThreadId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
      generationTimeMs: null,
      toolCalls: null,
    };
    setMessages((prev) => [...prev, botMsg]);
    setStreamingMessageId(assistantMsgId);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), threadId: targetThreadId }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("Response body is null");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

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
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg
                  )
                );
              } else if (data.type === "done") {
                // Final update with complete answer
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: data.answer || accumulatedContent }
                      : msg
                  )
                );
                setStreamingMessageId(null);
              } else if (data.type === "error") {
                throw new Error(data.error || "Unknown error");
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data", parseError);
            }
          }
        }
      }

      // Reload threads to update the order
      onThreadsReload();
    } catch (error) {
      console.error("Failed to send message", error);
      // Remove the assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
      setStreamingMessageId(null);
    } finally {
      setIsLoading(false);
      sendingToThreadIdRef.current = null;
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    isLoadingMessages,
    streamingMessageId,
    sendMessage,
    clearMessages,
  };
}
