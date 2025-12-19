"use client";

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon";
import PrimaryButton from "@/src/components/buttons/PrimaryButton";
import ThinkingNotification from "@/src/components/ThinkingNotification";
import ThreadSettingsButton from "@/src/components/ThreadSettingsButton";
import ErrorNotification from "@/src/components/ErrorNotification";
import type { Message } from "@/src/lib/db/schema";
import type { Thread } from "@/src/lib/db/schema";

type MessageInputProps = {
  isLoading: boolean;
  isLoadingMessages: boolean;
  messages: Message[];
  onSubmit: (message: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  error?: string | null;
  currentThreadId: number | null;
  currentThread: Thread | null;
  onThreadUpdate?: (
    threadId: number,
    updates: {
      model?: string;
      maxPromptLength?: "none" | 1024 | 4096 | null;
      userPrompt?: string | null;
    }
  ) => Promise<void>;
  onThreadDelete?: (threadId: number) => Promise<void>;
  onError?: (error: string) => void;
  newThreadModel?: string;
  newThreadMaxPromptLength?: "none" | 1024 | 4096;
  newThreadUserPrompt?: string;
  onNewThreadModelChange?: (model: string) => void;
  onNewThreadMaxPromptLengthChange?: (value: "none" | 1024 | 4096) => void;
  onNewThreadUserPromptChange?: (userPrompt: string) => void;
};

export type MessageInputRef = {
  focus: () => void;
};

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  (
    {
      isLoading,
      isLoadingMessages,
      messages,
      onSubmit,
      isStreaming = false,
      onStop,
      error,
      currentThreadId,
      currentThread,
      onThreadUpdate,
      onThreadDelete,
      onError,
      newThreadModel,
      newThreadMaxPromptLength,
      newThreadUserPrompt,
      onNewThreadModelChange,
      onNewThreadMaxPromptLengthChange,
      onNewThreadUserPromptChange,
    },
    ref
  ) => {
    const [input, setInput] = useState("");
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const draftInputRef = useRef<string>("");

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

    const isAnyLoading = isLoading || isLoadingMessages;

    const handleSubmit = (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      if (!input.trim() || isAnyLoading) return;

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

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "ArrowUp" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Save current input as draft if we're starting to cycle from the current state
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
            // Restore draft input when cycling back to current state
            setHistoryIndex(null);
            setInput(draftInputRef.current);
          }
        }
      }
    };

    return (
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex justify-center p-1">
        <div className="pointer-events-auto m-4 w-full max-w-5xl">
          <div className="mb-2 grid grid-cols-3 items-start gap-2">
            <div className="flex items-center">
              {isStreaming && onStop && <ThinkingNotification onStop={onStop} />}
            </div>
            <div className="flex items-center justify-center">
              {error && <ErrorNotification message={error} />}
            </div>
            <div className="flex items-center justify-end">
              {currentThreadId !== null && currentThread && onThreadUpdate && onThreadDelete ? (
                <ThreadSettingsButton
                  thread={currentThread}
                  onUpdateThread={onThreadUpdate}
                  onDeleteThread={onThreadDelete}
                  onError={onError}
                />
              ) : currentThreadId === null &&
                onNewThreadModelChange &&
                onNewThreadMaxPromptLengthChange &&
                onNewThreadUserPromptChange ? (
                <ThreadSettingsButton
                  thread={null}
                  initialModel={newThreadModel}
                  initialMaxPromptLength={newThreadMaxPromptLength}
                  initialUserPrompt={newThreadUserPrompt}
                  onModelChange={onNewThreadModelChange}
                  onMaxPromptLengthChange={onNewThreadMaxPromptLengthChange}
                  onUserPromptChange={onNewThreadUserPromptChange}
                  onError={onError}
                />
              ) : null}
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="relative rounded-lg bg-neutral-300 shadow-lg dark:bg-neutral-700"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAnyLoading ? "" : "Type a message..."}
              disabled={isAnyLoading}
              rows={3}
              className="w-full resize-none overflow-y-auto bg-transparent p-4 pr-12 placeholder:italic placeholder:text-neutral-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-neutral-400"
            />
            <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
              <PrimaryButton color="neutral" type="submit" disabled={isAnyLoading}>
                <PaperPlaneIcon
                  className={`h-8 w-10 p-1.5 ${isAnyLoading ? "animate-spin-and-color-cycle" : ""}`}
                />
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

MessageInput.displayName = "MessageInput";

export default MessageInput;
