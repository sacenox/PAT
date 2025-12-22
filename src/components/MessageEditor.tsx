"use client";

import { useAppContext } from "@/src/components/App";
import Button from "@/src/components/Button";
import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon";
import TrashIcon from "@/src/components/icons/TrashIcon";
import { useNewThread } from "@/src/hooks/api/useNewThread";
import { useNewThreadMessage } from "@/src/hooks/api/useNewThreadMessage";
import { useAutoResizeTextarea } from "@/src/hooks/useAutoResizeTextarea";
import { Message } from "@/src/lib/db/schema";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function MessageEditor({
  setLoadedMessages,
}: {
  setLoadedMessages: Dispatch<SetStateAction<Message[]>>;
}) {
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    selectedModel,
    models,
    maxPromptLength,
    userPrompt,
    selectedThreadId,
    setSelectedThreadId,
  } = useAppContext();
  const textareaRef = useAutoResizeTextarea(userMessage);

  const { mutate: createThreadMessage, isPending: isCreatingThreadMessage } = useNewThreadMessage(
    selectedThreadId,
    userMessage,
    (msg) => {
      setLoadedMessages(
        (previousMessages) =>
          [
            ...previousMessages.filter((message) => message.id !== 0), // Remove messages that are not saved yet
            {
              id: 0, // Means it's not saved yet
              createdAt: new Date(),
              threadId: selectedThreadId,
              role: "user",
              content: userMessage,
            },
            {
              id: 0, // Means it's not saved yet
              createdAt: new Date(),
              threadId: selectedThreadId,
              role: msg.role,
              content: msg.content,
              thinking: msg.thinking,
            },
          ] as Message[]
      );
    },
    () => {
      setUserMessage("");
      textareaRef.current?.focus();
    }
  );

  const { mutate: createThread, isPending: isCreatingThread } = useNewThread(
    userMessage,
    selectedModel?.name || models[0]?.name,
    maxPromptLength === null ? "none" : (maxPromptLength as 1024 | 4096),
    userPrompt,
    new Date().toISOString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    (threadId: number) => {
      setSelectedThreadId(() => {
        createThreadMessage();
        return threadId;
      });
    }
  );

  useEffect(() => {
    setIsLoading(isCreatingThread || isCreatingThreadMessage);
  }, [isCreatingThread, isCreatingThreadMessage]);

  const handleSave = () => {
    if (!selectedThreadId) {
      createThread();
    } else {
      createThreadMessage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-80 z-10 flex justify-center p-8">
      <div className="flex w-full max-w-5xl flex-col gap-2 rounded-lg bg-neutral-200 p-4 shadow-md dark:bg-neutral-800">
        <textarea
          ref={textareaRef}
          placeholder="Send PAT a message..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="resize-none rounded-md bg-neutral-50 px-4 py-2 text-neutral-800 placeholder:italic focus:outline-none dark:bg-neutral-950 dark:text-neutral-300 "
          disabled={isLoading}
        />
        <div className="flex flex-row items-center justify-end gap-2">
          {userMessage && (
            <Button
              color="neutral"
              type="button"
              onClick={() => setUserMessage("")}
              disabled={isLoading}
            >
              <TrashIcon className="h-8 w-10 p-1.5" />
              Clear
            </Button>
          )}
          <Button color="neutral" type="button" onClick={handleSave} disabled={isLoading}>
            <PaperPlaneIcon className="h-8 w-10 p-1.5" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
