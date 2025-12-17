import { useState, useEffect, useRef } from "react";

export function useThreadSelection(
  onThreadSelect?: (threadId: number) => void,
  onThreadDeselect?: () => void
) {
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top when a thread is selected
    if (currentThreadId !== null && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
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
