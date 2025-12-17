import { useState, useEffect, useCallback } from "react";
import type { Message } from "@/src/lib/db/schema";

export function useMessages(threadId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadMessages = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/threads/${id}/messages`);
      const data = await res.json();
      const loadedMessages = data.messages || [];
      setMessages(loadedMessages);
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  }, []);

  useEffect(() => {
    if (threadId !== null) {
      loadMessages(threadId);
    } else {
      setMessages([]);
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
      onThreadSelect(targetThreadId);
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), threadId: targetThreadId }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: Date.now() + 1,
        threadId: targetThreadId,
        role: "assistant",
        content: data.answer || "",
        createdAt: new Date(),
        generationTimeMs: null,
        toolCalls: null,
      };
      setMessages((prev) => [...prev, botMsg]);

      // Reload messages to get correct IDs from database
      await loadMessages(targetThreadId);

      // Reload threads to update the order
      onThreadsReload();
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}

