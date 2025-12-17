"use client";

import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon";
import type { Message } from "@/src/lib/db/schema";

type MessageInputProps = {
  isLoading: boolean;
  messages: Message[];
  onSubmit: (message: string) => void;
};

export type MessageInputRef = {
  focus: () => void;
};

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  ({ isLoading, messages, onSubmit }, ref) => {
    const [input, setInput] = useState("");
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const inputValue = input.trim();
      onSubmit(inputValue);
      setInput("");
      setHistoryIndex(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Only cycle through user messages, not assistant messages
      const userMessages = messages.filter((m) => m.role === "user");

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const idx = historyIndex ?? userMessages.length;
        if (idx > 0) {
          const newIdx = idx - 1;
          setHistoryIndex(newIdx);
          setInput(userMessages[newIdx].content);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex !== null) {
          const newIdx = historyIndex + 1;
          if (newIdx < userMessages.length) {
            setHistoryIndex(newIdx);
            setInput(userMessages[newIdx].content);
          } else {
            setHistoryIndex(null);
            setInput("");
          }
        }
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3),0_-2px_4px_-1px_rgba(0,0,0,0.2)]"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Loading answer..." : "Type a message..."}
          disabled={isLoading}
          className="flex-1 bg-neutral-200 px-2 py-2 placeholder:italic placeholder:text-neutral-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-green-900 px-3 py-1 text-neutral-100 hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:text-neutral-900 dark:hover:bg-green-600"
        >
          <PaperPlaneIcon className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </form>
    );
  }
);

MessageInput.displayName = "MessageInput";

export default MessageInput;
