"use client";
import { useRef } from "react";
import Sidebar from "@/src/components/Sidebar";
import MessageInput, { type MessageInputRef } from "@/src/components/MessageInput";
import MessageList from "@/src/components/MessageList";
import NoThreadSelected from "@/src/components/NoThreadSelected";
import { useTheme } from "@/src/hooks/useTheme";
import { useModel } from "@/src/hooks/useModel";
import { useMaxPromptLength } from "@/src/hooks/useMaxPromptLength";
import { useThreads } from "@/src/hooks/useThreads";
import { useMessages } from "@/src/hooks/useMessages";
import { useThreadSelection } from "@/src/hooks/useThreadSelection";
import "./highlight-theme.css";

export default function Home() {
  const { themeMode, handleThemeChange } = useTheme();
  const { selectedModel, handleModelChange } = useModel();
  const { maxPromptLength, handleMaxPromptLengthChange } = useMaxPromptLength();
  const {
    threads,
    totalThreadCount,
    hasMoreThreads,
    loadThreads,
    loadMoreThreads,
    createThread,
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
    deleteMessage,
  } = useMessages(currentThreadId);
  const messageInputRef = useRef<MessageInputRef>(null);

  const handleThreadSelect = (threadId: number) => {
    selectThread(threadId);
  };

  const handleCreateNewThread = () => {
    deselectThread();
    clearMessages();
    // Focus the input after a short delay to ensure DOM has updated
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  const handleThreadDelete = async (threadId: number) => {
    try {
      await deleteThread(threadId);
      // If the deleted thread was the current thread, deselect it
      if (currentThreadId === threadId) {
        deselectThread();
        clearMessages();
      }
    } catch (error) {
      console.error("Failed to delete thread", error);
    }
  };

  const handleSendMessage = async (message: string) => {
    await sendMessage(
      message,
      currentThreadId,
      createThread,
      selectThread,
      loadThreads,
      selectedModel,
      maxPromptLength
    );
  };

  // Get the model name for the current thread, or use selected model if no thread
  const currentModelName =
    currentThreadId !== null
      ? threads.find((t) => t.id === currentThreadId)?.model || selectedModel || "gpt-oss"
      : selectedModel || "gpt-oss";

  return (
    <div className="flex h-screen bg-neutral-100 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          ref={messagesContainerRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden bg-neutral-100 p-4 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 ${
            isLoading && streamingMessageId !== null ? "pb-44" : "pb-40"
          }`}
        >
          <div
            className={`mx-auto flex min-h-full max-w-5xl flex-col gap-8 ${currentThreadId === null ? "justify-center" : "justify-end"}`}
          >
            {currentThreadId === null ? (
              <NoThreadSelected threadCount={totalThreadCount} />
            ) : (
              <MessageList
                messages={messages}
                streamingMessageId={streamingMessageId}
                threadId={currentThreadId}
                onDeleteMessage={deleteMessage}
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
          modelName={currentModelName}
          isStreaming={isLoading && streamingMessageId !== null}
          onStop={stopGeneration}
          currentThreadId={currentThreadId}
          currentThread={currentThreadId !== null ? threads.find((t) => t.id === currentThreadId) || null : null}
          onThreadDelete={handleThreadDelete}
        />
      </div>
      <Sidebar
        threads={threads}
        currentThreadId={currentThreadId}
        themeMode={themeMode}
        onCreateNewThread={handleCreateNewThread}
        onThreadSelect={handleThreadSelect}
        onThemeChange={handleThemeChange}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        maxPromptLength={maxPromptLength}
        onMaxPromptLengthChange={handleMaxPromptLengthChange}
        onLoadMore={loadMoreThreads}
        hasMoreThreads={hasMoreThreads}
      />
    </div>
  );
}
