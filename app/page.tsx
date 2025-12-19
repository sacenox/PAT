"use client";
import { useRef, useState, useEffect } from "react";
import Sidebar from "@/src/components/Sidebar";
import MessageInput, { type MessageInputRef } from "@/src/components/MessageInput";
import MessageList from "@/src/components/MessageList";
import NoThreadSelected from "@/src/components/NoThreadSelected";
import { useTheme } from "@/src/hooks/useTheme";
import { useSettings } from "@/src/hooks/useSettings";
import { useThreads } from "@/src/hooks/useThreads";
import { useMessages } from "@/src/hooks/useMessages";
import { useThreadSelection } from "@/src/hooks/useThreadSelection";
import "./highlight-theme.css";

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const { themeMode, handleThemeChange } = useTheme();
  const { selectedModel, handleModelChange, maxPromptLength, handleMaxPromptLengthChange } =
    useSettings(setError);
  const {
    threads,
    totalThreadCount,
    hasMoreThreads,
    loadThreads,
    loadMoreThreads,
    createThread,
    updateThread,
    deleteThread,
  } = useThreads();
  const { currentThreadId, selectThread, deselectThread, messagesContainerRef } =
    useThreadSelection();
  const {
    messages,
    isLoading,
    isLoadingMessages,
    streamingMessageId,
    sendMessage,
    clearMessages,
    stopGeneration,
    deleteMessage: deleteMessageInternal,
  } = useMessages(currentThreadId, setError, async (threadId: number, title: string) => {
    await updateThread(threadId, { title }, setError);
    await loadThreads(8, setError);
  });
  const messageInputRef = useRef<MessageInputRef>(null);

  const handleDeleteMessage = (messageId: number, threadId: number) => {
    deleteMessageInternal(messageId, threadId, setError);
  };

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleThreadSelect = (threadId: number) => {
    setError(null);
    selectThread(threadId);
  };

  const handleCreateNewThread = () => {
    deselectThread();
    clearMessages();
    setError(null);
    // Focus the input after a short delay to ensure DOM has updated
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  const handleThreadUpdate = async (
    threadId: number,
    updates: { model?: string; maxPromptLength?: "none" | 1024 | 4096 | null }
  ) => {
    setError(null);
    try {
      await updateThread(threadId, updates, setError);
      // Reload threads to ensure UI is in sync
      await loadThreads(8, setError);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  const handleThreadDelete = async (threadId: number) => {
    setError(null);
    try {
      await deleteThread(threadId, setError);
      // If the deleted thread was the current thread, deselect it
      if (currentThreadId === threadId) {
        deselectThread();
        clearMessages();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  const handleSendMessage = async (message: string) => {
    setError(null);
    try {
      await sendMessage(
        message,
        currentThreadId,
        (title, firstMessage, model, maxPromptLength) =>
          createThread(title, firstMessage, model, maxPromptLength, setError),
        selectThread,
        () => loadThreads(8, setError),
        selectedModel,
        maxPromptLength,
        setError
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  return (
    <div className="flex h-screen bg-neutral-100 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          ref={messagesContainerRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden bg-neutral-100 p-4 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 ${
            isLoading && streamingMessageId !== null ? "pb-52" : "pb-48"
          }`}
        >
          <div
            className={`mx-auto flex min-h-full max-w-5xl flex-col gap-8 ${currentThreadId === null ? "justify-center" : "justify-end"}`}
          >
            {currentThreadId === null ? (
              <NoThreadSelected
                threadCount={totalThreadCount}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                maxPromptLength={maxPromptLength}
                onMaxPromptLengthChange={handleMaxPromptLengthChange}
                onError={setError}
              />
            ) : (
              <MessageList
                messages={messages}
                threadId={currentThreadId}
                onDeleteMessage={handleDeleteMessage}
              />
            )}
          </div>
        </div>
        <MessageInput
          ref={messageInputRef}
          isLoading={isLoading}
          isLoadingMessages={isLoadingMessages}
          messages={messages}
          onSubmit={handleSendMessage}
          isStreaming={isLoading && streamingMessageId !== null}
          onStop={stopGeneration}
          error={error}
          currentThreadId={currentThreadId}
          currentThread={
            currentThreadId !== null ? threads.find((t) => t.id === currentThreadId) || null : null
          }
          onThreadUpdate={handleThreadUpdate}
          onThreadDelete={handleThreadDelete}
          onError={setError}
        />
      </div>
      <Sidebar
        threads={threads}
        currentThreadId={currentThreadId}
        themeMode={themeMode}
        onCreateNewThread={handleCreateNewThread}
        onThreadSelect={handleThreadSelect}
        onThemeChange={handleThemeChange}
        onLoadMore={() => {
          void loadMoreThreads(8, setError);
        }}
        hasMoreThreads={hasMoreThreads}
      />
    </div>
  );
}
