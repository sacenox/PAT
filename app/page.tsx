"use client";
import { useRef } from "react";
import Sidebar from "@/src/components/Sidebar";
import MessageInput, { type MessageInputRef } from "@/src/components/MessageInput";
import MessageList from "@/src/components/MessageList";
import NoThreadSelected from "@/src/components/NoThreadSelected";
import { useTheme } from "@/src/hooks/useTheme";
import { useThreads } from "@/src/hooks/useThreads";
import { useMessages } from "@/src/hooks/useMessages";
import { useThreadSelection } from "@/src/hooks/useThreadSelection";
import "./highlight-theme.css";

export default function Home() {
  const { themeMode, handleThemeChange } = useTheme();
  const { threads, totalThreadCount, hasMoreThreads, loadThreads, loadMoreThreads, createThread } =
    useThreads();
  const { currentThreadId, selectThread, deselectThread, messagesContainerRef } =
    useThreadSelection();
  const { messages, isLoading, sendMessage, clearMessages } = useMessages(currentThreadId);
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

  const handleSendMessage = async (message: string) => {
    await sendMessage(message, currentThreadId, createThread, selectThread, loadThreads);
  };


  return (
    <div className="flex h-screen bg-neutral-100 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-neutral-100 p-4 dark:bg-neutral-950"
        >
          <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-end gap-8">
            {currentThreadId === null ? (
              <NoThreadSelected threadCount={totalThreadCount} />
            ) : (
              <MessageList messages={messages} />
            )}
          </div>
        </div>
        <MessageInput
          ref={messageInputRef}
          isLoading={isLoading}
          messages={messages}
          onSubmit={handleSendMessage}
        />
      </div>
      <Sidebar
        threads={threads}
        currentThreadId={currentThreadId}
        themeMode={themeMode}
        onCreateNewThread={handleCreateNewThread}
        onThreadSelect={handleThreadSelect}
        onThemeChange={handleThemeChange}
        onLoadMore={loadMoreThreads}
        hasMoreThreads={hasMoreThreads}
      />
    </div>
  );
}
