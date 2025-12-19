"use client";
import { useRef, useMemo, useCallback, useEffect } from "react";
import Sidebar from "@/src/components/Sidebar";
import MessageInput, { type MessageInputRef } from "@/src/components/MessageInput";
import MessageList from "@/src/components/MessageList";
import NoThreadSelected from "@/src/components/NoThreadSelected";
import { useTheme } from "@/src/hooks/useTheme";
import { useThreads } from "@/src/hooks/useThreads";
import { useMessages } from "@/src/hooks/useMessages";
import { useThreadSelection } from "@/src/hooks/useThreadSelection";
import { useLocalStorage } from "@/src/hooks/useLocalStorage";
import { useModelValidation } from "@/src/hooks/useModelValidation";
import { useErrorWithAutoDismiss } from "@/src/hooks/useErrorWithAutoDismiss";
import { getErrorMessage } from "@/src/lib/errors";
import "./highlight-theme.css";

export default function Home() {
  const [error, setError] = useErrorWithAutoDismiss();
  const { themeMode, handleThemeChange } = useTheme();
  const [selectedModel, setSelectedModel] = useLocalStorage<string>("selectedModel", "gpt-oss");
  const [maxPromptLength, setMaxPromptLength] = useLocalStorage<"none" | 1024 | 4096>(
    "maxPromptLength",
    "none"
  );
  const [newThreadUserPrompt, setNewThreadUserPrompt] = useLocalStorage<string>(
    "newThreadUserPrompt",
    ""
  );

  useModelValidation(selectedModel, setSelectedModel);

  const { currentThreadId, selectThread, deselectThread, messagesContainerRef } =
    useThreadSelection();

  const clearMessagesRef = useRef<(() => void) | undefined>(undefined);

  const {
    threads,
    totalThreadCount,
    hasMoreThreads,
    loadThreads,
    loadMoreThreads,
    createThread,
    updateThread,
    handleThreadSelect,
    handleThreadUpdate,
    handleThreadDelete,
  } = useThreads({
    selectThread,
    deselectThread,
    clearMessagesRef,
    currentThreadId,
    setError,
  });

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

  useEffect(() => {
    clearMessagesRef.current = clearMessages;
  }, [clearMessages]);
  const messageInputRef = useRef<MessageInputRef>(null);

  const handleModelChange = useCallback(
    (model: string) => {
      setSelectedModel(model);
    },
    [setSelectedModel]
  );

  const handleMaxPromptLengthChange = useCallback(
    (value: "none" | 1024 | 4096) => {
      setMaxPromptLength(value);
    },
    [setMaxPromptLength]
  );

  const handleNewThreadUserPromptChange = useCallback(
    (userPrompt: string) => {
      setNewThreadUserPrompt(userPrompt);
    },
    [setNewThreadUserPrompt]
  );

  const handleDeleteMessage = useCallback(
    (messageId: number, threadId: number) => {
      deleteMessageInternal(messageId, threadId, setError);
    },
    [deleteMessageInternal, setError]
  );

  const handleCreateNewThread = useCallback(() => {
    deselectThread();
    clearMessages();
    setError(null);
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  }, [deselectThread, clearMessages, setError]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      setError(null);
      try {
        await sendMessage(
          message,
          currentThreadId,
          (title, firstMessage) =>
            createThread(
              selectedModel,
              maxPromptLength,
              title,
              firstMessage,
              newThreadUserPrompt,
              setError
            ),
          selectThread,
          () => loadThreads(8, setError),
          setError
        );
      } catch (error) {
        setError(getErrorMessage(error));
      }
    },
    [
      sendMessage,
      currentThreadId,
      createThread,
      selectedModel,
      maxPromptLength,
      newThreadUserPrompt,
      selectThread,
      loadThreads,
      setError,
    ]
  );

  const currentThread = useMemo(
    () => (currentThreadId !== null ? threads.find((t) => t.id === currentThreadId) || null : null),
    [currentThreadId, threads]
  );

  const handleLoadMore = useCallback(() => {
    void loadMoreThreads(8, setError);
  }, [loadMoreThreads, setError]);

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
              <NoThreadSelected />
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
          currentThread={currentThread}
          onThreadUpdate={handleThreadUpdate}
          onThreadDelete={handleThreadDelete}
          onError={setError}
          newThreadModel={selectedModel}
          newThreadMaxPromptLength={maxPromptLength}
          newThreadUserPrompt={newThreadUserPrompt}
          onNewThreadModelChange={handleModelChange}
          onNewThreadMaxPromptLengthChange={handleMaxPromptLengthChange}
          onNewThreadUserPromptChange={handleNewThreadUserPromptChange}
        />
      </div>
      <Sidebar
        threads={threads}
        currentThreadId={currentThreadId}
        themeMode={themeMode}
        onCreateNewThread={handleCreateNewThread}
        onThreadSelect={handleThreadSelect}
        onThemeChange={handleThemeChange}
        onLoadMore={handleLoadMore}
        hasMoreThreads={hasMoreThreads}
        totalThreadCount={totalThreadCount}
      />
    </div>
  );
}
