import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for managing thread selection state.
 * Handles selecting/deselecting threads and automatically scrolls to top when a thread is selected.
 *
 * @param onThreadSelect - Optional callback function called when a thread is selected
 * @param onThreadDeselect - Optional callback function called when a thread is deselected
 * @returns Object containing:
 *   - `currentThreadId` - The currently selected thread ID, or null if none selected
 *   - `setCurrentThreadId` - Function to directly set the current thread ID
 *   - `selectThread` - Function to select a thread by ID
 *   - `deselectThread` - Function to deselect the current thread
 *   - `messagesContainerRef` - Ref to attach to the messages container element for scrolling
 */
export function useThreadSelection(
  onThreadSelect?: (threadId: number) => void,
  onThreadDeselect?: () => void
) {
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top when a thread is selected
    if (currentThreadId !== null && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentThreadId]);

  const selectThread = (threadId: number) => {
    setCurrentThreadId(threadId);
    if (onThreadSelect) {
      onThreadSelect(threadId);
    }
  };

  const deselectThread = () => {
    setCurrentThreadId(null);
    if (onThreadDeselect) {
      onThreadDeselect();
    }
  };

  return {
    currentThreadId,
    setCurrentThreadId,
    selectThread,
    deselectThread,
    messagesContainerRef,
  };
}
