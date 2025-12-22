"use client";

import { useAppContext } from "@/src/components/App";
import MessageEditor from "@/src/components/MessageEditor";
import MessageList from "@/src/components/MessageList";
import Welcome from "@/src/components/Welcome";
import { useThreadMessages } from "@/src/hooks/api/useThreadMessages";
import { Message } from "@/src/lib/db/schema";
import { useCallback, useState } from "react";

export default function Main() {
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const { selectedThreadId, showSystemMessages, showToolMessages } = useAppContext();
  const optionalRoles = [
    ...(showSystemMessages ? ["system"] : []),
    ...(showToolMessages ? ["tool"] : []),
  ];

  const handleSetLoadedMessages = useCallback((messages: Message[]) => {
    setLoadedMessages(messages);
  }, []);

  const { isLoading: isLoadingMessages, error: messagesError } = useThreadMessages(
    selectedThreadId,
    optionalRoles,
    handleSetLoadedMessages
  );

  return (
    <div className="relative flex-1 overflow-y-auto pb-48">
      {selectedThreadId ? (
        <MessageList
          messages={loadedMessages}
          isLoading={isLoadingMessages}
          error={messagesError ?? null}
        />
      ) : (
        <Welcome />
      )}
      <MessageEditor setLoadedMessages={setLoadedMessages} />
    </div>
  );
}
