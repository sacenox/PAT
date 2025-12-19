import { useState, useEffect } from "react";
import type { Thread } from "@/src/lib/db/schema";

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [totalThreadCount, setTotalThreadCount] = useState<number>(0);
  const [hasMoreThreads, setHasMoreThreads] = useState<boolean>(true);

  const loadThreads = async (limit: number = 8, onError?: (error: string) => void) => {
    try {
      const res = await fetch(`/api/threads?limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Failed to load threads: ${res.status}`);
      }
      const data = await res.json();
      const threadsList = data.threads || [];
      setThreads(threadsList);
      setHasMoreThreads(data.hasMore || false);
      setTotalThreadCount(data.totalCount || 0);
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error.message);
      }
    }
  };

  const loadMoreThreads = async (limit: number = 8, onError?: (error: string) => void) => {
    try {
      const offset = threads.length;
      const res = await fetch(`/api/threads?offset=${offset}&limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Failed to load more threads: ${res.status}`);
      }
      const data = await res.json();
      const newThreads = data.threads || [];
      if (newThreads.length > 0) {
        setThreads((prev) => [...prev, ...newThreads]);
        setHasMoreThreads(data.hasMore || false);
      } else {
        setHasMoreThreads(false);
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error.message);
      }
    }
  };

  const createThread = async (
    titleOverride?: string,
    firstMessage?: string,
    model: string,
    maxPromptLength: "none" | 1024 | 4096,
    onError?: (error: string) => void
  ): Promise<number | null> => {
    try {
      const title = titleOverride || (firstMessage ? firstMessage.substring(0, 100) : "New Thread");

      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          model,
          maxPromptLength,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to create thread: ${res.status}`);
      }
      const data = await res.json();
      const newThread = data.thread;

      // Reload threads to get the full list
      await loadThreads(8);

      return newThread.id;
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error.message);
      }
      return null;
    }
  };

  const updateThread = async (
    threadId: number,
    updates: {
      model?: string;
      maxPromptLength?: "none" | 1024 | 4096 | null;
      title?: string;
    },
    onError?: (error: string) => void
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          // Only send title if it's provided
          ...(updates.title !== undefined ? { title: updates.title } : {}),
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch((parseError) => {
          throw new Error(
            `Failed to parse error response: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
          );
        });
        throw new Error(errorData.error || "Failed to update thread");
      }
      const data = await res.json();
      const updatedThread = data.thread;

      // Update the thread in local state
      setThreads((prev) => prev.map((t) => (t.id === threadId ? updatedThread : t)));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update thread";
      if (onError) onError(errorMsg);
      throw error;
    }
  };

  const deleteThread = async (
    threadId: number,
    onError?: (error: string) => void
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json().catch((parseError) => {
          throw new Error(
            `Failed to parse error response: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
          );
        });
        throw new Error(errorData.error || "Failed to delete thread");
      }
      // Remove the thread from the local state
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      setTotalThreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete thread";
      if (onError) onError(errorMsg);
      throw error;
    }
  };

  useEffect(() => {
    loadThreads(8);
  }, []);

  return {
    threads,
    totalThreadCount,
    hasMoreThreads,
    loadThreads,
    loadMoreThreads,
    createThread,
    updateThread,
    deleteThread,
  };
}
