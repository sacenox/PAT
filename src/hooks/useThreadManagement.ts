import { useCallback } from "react";
import { getErrorMessage } from "@/src/lib/errors";

type ThreadUpdates = {
  model?: string;
  maxPromptLength?: "none" | 1024 | 4096 | null;
  userPrompt?: string | null;
  title?: string;
};

/**
 * Custom hook for managing thread operations with error handling.
 * Provides handlers for thread selection, creation, update, and deletion.
 *
 * @param updateThread - Function to update a thread
 * @param deleteThread - Function to delete a thread
 * @param loadThreads - Function to reload threads list
 * @param selectThread - Function to select a thread
 * @param deselectThread - Function to deselect current thread
 * @param clearMessages - Function to clear messages
 * @param currentThreadId - Currently selected thread ID
 * @param setError - Function to set error state
 * @returns Object containing thread management handlers
 */
export function useThreadManagement(
  updateThread: (
    threadId: number,
    updates: ThreadUpdates,
    onError?: (error: string) => void
  ) => Promise<void>,
  deleteThread: (threadId: number, onError?: (error: string) => void) => Promise<void>,
  loadThreads: (limit: number, onError?: (error: string) => void) => Promise<void>,
  selectThread: (threadId: number) => void,
  deselectThread: () => void,
  clearMessages: () => void,
  currentThreadId: number | null,
  setError: (error: string | null) => void
) {
  const handleThreadSelect = useCallback(
    (threadId: number) => {
      setError(null);
      selectThread(threadId);
    },
    [selectThread, setError]
  );

  const handleThreadUpdate = useCallback(
    async (threadId: number, updates: ThreadUpdates) => {
      setError(null);
      try {
        await updateThread(threadId, updates, setError);
        await loadThreads(8, setError);
      } catch (error) {
        setError(getErrorMessage(error));
      }
    },
    [updateThread, loadThreads, setError]
  );

  const handleThreadDelete = useCallback(
    async (threadId: number) => {
      setError(null);
      try {
        await deleteThread(threadId, setError);
        if (currentThreadId === threadId) {
          deselectThread();
          clearMessages();
        }
      } catch (error) {
        setError(getErrorMessage(error));
      }
    },
    [deleteThread, currentThreadId, deselectThread, clearMessages, setError]
  );

  return {
    handleThreadSelect,
    handleThreadUpdate,
    handleThreadDelete,
  };
}
