"use client";

import { useImperativeHandle, forwardRef } from "react";
import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon";
import PrimaryButton from "@/src/components/buttons/PrimaryButton";
import ThinkingNotification from "@/src/components/ThinkingNotification";
import ThreadSettingsButton from "@/src/components/ThreadSettingsButton";
import ErrorNotification from "@/src/components/ErrorNotification";
import type { Message } from "@/src/lib/db/schema";
import type { Thread } from "@/src/lib/db/schema";
import { useAutoResizeTextarea } from "@/src/hooks/useAutoResizeTextarea";
import { useMessageHistory } from "@/src/hooks/useMessageHistory";

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
    const { input, setInput, handleKeyDown, resetHistory } = useMessageHistory(messages);
    const textareaRef = useAutoResizeTextarea(input);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    const isAnyLoading = isLoading || isLoadingMessages;

    const handleSubmit = (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      if (!input.trim() || isAnyLoading) return;

      const inputValue = input.trim();
      onSubmit(inputValue);
      setInput("");
      resetHistory();

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    };

    const handleKeyDownWithSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else {
        handleKeyDown(e);
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
              onKeyDown={handleKeyDownWithSubmit}
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
