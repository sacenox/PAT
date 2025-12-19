import { useState, useEffect, useCallback, useRef } from "react";
import type React from "react";
import type { Thread } from "@/src/lib/db/schema";
import { getErrorMessage, handleError } from "@/src/lib/errors";
import { useFetch } from "./useFetch";

export type ThreadUpdates = {
  model?: string;
  maxPromptLength?: "none" | 1024 | 4096 | null;
  userPrompt?: string | null;
  title?: string;
};

type ThreadManagementConfig = {
  selectThread: (threadId: number) => void;
  deselectThread: () => void;
  clearMessagesRef?: React.MutableRefObject<(() => void) | undefined>;
  currentThreadId: number | null;
  setError: (error: string | null) => void;
};

/**
 * Custom hook for managing conversation threads.
 * Provides state and functions for loading, creating, updating, and deleting threads.
 *
 * @param config - Optional configuration for thread management handlers
 * @returns Object containing:
 *   - `threads` - Array of currently loaded threads
 *   - `totalThreadCount` - Total number of threads in the database
 *   - `hasMoreThreads` - Whether there are more threads to load
 *   - `loadThreads` - Function to load threads with optional limit and error callback
 *   - `loadMoreThreads` - Function to load additional threads (pagination)
 *   - `createThread` - Function to create a new thread
 *   - `updateThread` - Function to update an existing thread
 *   - `deleteThread` - Function to delete a thread
 *   - `handleThreadSelect` - Handler for thread selection (only if config provided)
 *   - `handleThreadUpdate` - Handler for thread updates (only if config provided)
 *   - `handleThreadDelete` - Handler for thread deletion (only if config provided)
 */
export function useThreads(config?: ThreadManagementConfig) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [totalThreadCount, setTotalThreadCount] = useState<number>(0);
  const [hasMoreThreads, setHasMoreThreads] = useState<boolean>(true);
  const fetchWithErrorHandling = useFetch();
  const hasLoadedRef = useRef(false);

  const loadThreads = useCallback(
    async (limit: number = 8, onError?: (error: string) => void) => {
      const data = await fetchWithErrorHandling<{
        threads: Thread[];
        hasMore: boolean;
        totalCount: number;
      }>(`/api/threads?limit=${limit}`, { errorMessage: "Failed to load threads", onError });
      if (data) {
        const threadsList = data.threads || [];
        setThreads(threadsList);
        setHasMoreThreads(data.hasMore || false);
        setTotalThreadCount(data.totalCount || 0);
      }
    },
    [fetchWithErrorHandling]
  );

  const loadMoreThreads = useCallback(
    async (limit: number = 8, onError?: (error: string) => void) => {
      const offset = threads.length;
      const data = await fetchWithErrorHandling<{ threads: Thread[]; hasMore: boolean }>(
        `/api/threads?offset=${offset}&limit=${limit}`,
        { errorMessage: "Failed to load more threads", onError }
      );
      if (data) {
        const newThreads = data.threads || [];
        if (newThreads.length > 0) {
          setThreads((prev) => [...prev, ...newThreads]);
          setHasMoreThreads(data.hasMore || false);
        } else {
          setHasMoreThreads(false);
        }
      }
    },
    [threads.length, fetchWithErrorHandling]
  );

  const createThread = useCallback(
    async (
      model: string,
      maxPromptLength: "none" | 1024 | 4096,
      titleOverride?: string,
      firstMessage?: string,
      userPrompt?: string,
      onError?: (error: string) => void
    ): Promise<{
      threadId: number;
      systemMessage?: { id: number; content: string; createdAt: string };
    } | null> => {
      const title = titleOverride || (firstMessage ? firstMessage.substring(0, 100) : "New Thread");

      const data = await fetchWithErrorHandling<{
        thread: Thread;
        systemMessage?: { id: number; content: string; createdAt: string };
      }>("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          model,
          maxPromptLength,
          userPrompt: userPrompt || null,
        }),
        errorMessage: "Failed to create thread",
        onError,
      });

      if (!data) {
        return null;
      }

      const newThread = data.thread;

      // Reload threads to get the full list
      await loadThreads(8);

      return {
        threadId: newThread.id,
        systemMessage: data.systemMessage
          ? {
              id: data.systemMessage.id,
              content: data.systemMessage.content,
              createdAt: data.systemMessage.createdAt,
            }
          : undefined,
      };
    },
    [fetchWithErrorHandling, loadThreads]
  );

  const updateThread = useCallback(
    async (
      threadId: number,
      updates: {
        model?: string;
        maxPromptLength?: "none" | 1024 | 4096 | null;
        title?: string;
        userPrompt?: string | null;
      },
      onError?: (error: string) => void
    ): Promise<void> => {
      try {
        const data = await fetchWithErrorHandling<{ thread: Thread }>(`/api/threads/${threadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...updates,
            // Only send title if it's provided
            ...(updates.title !== undefined ? { title: updates.title } : {}),
          }),
          errorMessage: "Failed to update thread",
          throwOnError: true,
          onError,
        });

        if (data) {
          const updatedThread = data.thread;
          // Update the thread in local state
          setThreads((prev) => prev.map((t) => (t.id === threadId ? updatedThread : t)));
        }
      } catch (error) {
        const errorMsg = getErrorMessage(error, "Failed to update thread");
        handleError(errorMsg, onError);
        throw error;
      }
    },
    [fetchWithErrorHandling]
  );

  const deleteThread = useCallback(
    async (threadId: number, onError?: (error: string) => void): Promise<void> => {
      try {
        await fetchWithErrorHandling(`/api/threads/${threadId}`, {
          method: "DELETE",
          errorMessage: "Failed to delete thread",
          throwOnError: true,
          onError,
        });
        // Remove the thread from the local state
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        setTotalThreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        const errorMsg = getErrorMessage(error, "Failed to delete thread");
        handleError(errorMsg, onError);
        throw error;
      }
    },
    [fetchWithErrorHandling]
  );

  const handleThreadSelect = useCallback(
    (threadId: number) => {
      if (config) {
        config.setError(null);
        config.selectThread(threadId);
      }
    },
    [config]
  );

  const handleThreadUpdate = useCallback(
    async (threadId: number, updates: ThreadUpdates) => {
      if (config) {
        config.setError(null);
        try {
          await updateThread(threadId, updates, config.setError);
          await loadThreads(8, config.setError);
        } catch (error) {
          config.setError(getErrorMessage(error));
        }
      }
    },
    [config, updateThread, loadThreads]
  );

  const handleThreadDelete = useCallback(
    async (threadId: number) => {
      if (config) {
        config.setError(null);
        try {
          await deleteThread(threadId, config.setError);
          if (config.currentThreadId === threadId) {
            config.deselectThread();
            if (config.clearMessagesRef?.current) {
              config.clearMessagesRef.current();
            }
          }
        } catch (error) {
          config.setError(getErrorMessage(error));
        }
      }
    },
    [config, deleteThread]
  );

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;

      void loadThreads(8);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    handleThreadSelect: config ? handleThreadSelect : () => {},
    handleThreadUpdate: config ? handleThreadUpdate : async () => {},
    handleThreadDelete: config ? handleThreadDelete : async () => {},
  };
}
