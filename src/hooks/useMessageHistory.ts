import { useState, useRef } from "react";
import type { Message } from "@/src/lib/db/schema";

/**
 * Custom hook for managing message history navigation in a text input.
 * Allows cycling through previous user messages using Ctrl/Cmd + Arrow keys.
 *
 * @param messages - Array of all messages to extract user messages from
 * @returns Object containing:
 *   - `input` - Current input value
 *   - `setInput` - Function to set input value
 *   - `historyIndex` - Current history index (null if not navigating)
 *   - `handleKeyDown` - Handler function for keyboard events
 *   - `resetHistory` - Function to reset history navigation
 */
export function useMessageHistory(messages: Message[]) {
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const draftInputRef = useRef<string>("");

  const userMessages = messages.filter((m) => m.role === "user");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "ArrowUp" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (historyIndex === null) {
        draftInputRef.current = input;
      }
      const idx = historyIndex ?? userMessages.length;
      if (idx > 0) {
        const newIdx = idx - 1;
        setHistoryIndex(newIdx);
        setInput(userMessages[newIdx].content);
      }
    } else if (e.key === "ArrowDown" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (historyIndex !== null) {
        const newIdx = historyIndex + 1;
        if (newIdx < userMessages.length) {
          setHistoryIndex(newIdx);
          setInput(userMessages[newIdx].content);
        } else {
          setHistoryIndex(null);
          setInput(draftInputRef.current);
        }
      }
    }
  };

  const resetHistory = () => {
    setHistoryIndex(null);
  };

  return {
    input,
    setInput,
    historyIndex,
    handleKeyDown,
    resetHistory,
  };
}
