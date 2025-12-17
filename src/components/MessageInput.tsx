"use client";

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon";
import PrimaryButton from "@/src/components/buttons/PrimaryButton";
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    // Auto-resize textarea to keep an empty line at the bottom
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";

      // Calculate line height from computed styles
      const computedStyle = getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 8;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 8;

      // Minimum height for 3 lines
      const minHeight = lineHeight * 3 + paddingTop + paddingBottom;

      // Maximum height for 10 lines
      const maxHeight = lineHeight * 10 + paddingTop + paddingBottom;

      // Set height to scrollHeight or minHeight, whichever is larger
      // Add one extra line height to keep an empty line at the bottom
      // Cap at maxHeight to enable scrolling after 10 lines
      const calculatedHeight = textarea.scrollHeight + lineHeight;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, calculatedHeight));
      textarea.style.height = `${newHeight}px`;
    }, [input]);

    const handleSubmit = (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      if (!input.trim() || isLoading) return;

      const inputValue = input.trim();
      onSubmit(inputValue);
      setInput("");
      setHistoryIndex(null);

      // Reset textarea height after submit
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Only cycle through user messages, not assistant messages
      const userMessages = messages.filter((m) => m.role === "user");

      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "ArrowUp") {
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
        className="relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3),0_-2px_4px_-1px_rgba(0,0,0,0.2)]"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Loading answer..." : "Type a message..."}
          disabled={isLoading}
          rows={3}
          className="w-full resize-none overflow-y-auto bg-neutral-200 px-2 py-2 pr-12 placeholder:italic placeholder:text-neutral-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:placeholder:text-neutral-400"
        />
        <div className="absolute bottom-2 right-2">
          <PrimaryButton type="submit" disabled={isLoading}>
            <PaperPlaneIcon className={`h-9 w-9 p-1.5 ${isLoading ? "animate-spin" : ""}`} />
          </PrimaryButton>
        </div>
      </form>
    );
  }
);

MessageInput.displayName = "MessageInput";

export default MessageInput;
