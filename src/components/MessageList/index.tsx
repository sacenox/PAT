"use client";

import { useRef, useEffect } from "react";
import type { Message } from "@/src/lib/db/schema";
import AssistantMessage from "./AssistantMessage";
import UserMessage from "./UserMessage";
import DeleteMessageButton from "./DeleteMessageButton";

type MessageListProps = {
  messages: Message[];
  threadId: number | null;
  onDeleteMessage: (messageId: number, threadId: number) => void;
};

export default function MessageList({
  messages,
  threadId,
  onDeleteMessage,
}: MessageListProps) {
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevMessagesLengthRef = useRef<number>(0);

  useEffect(() => {
    // Scroll to the start of the newly added message
    if (messages.length > prevMessagesLengthRef.current) {
      const newMessage = messages[messages.length - 1];
      const messageElement = messageRefs.current.get(newMessage.id);
      if (messageElement) {
        messageElement.scrollIntoView({ block: "start", behavior: "smooth" });
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  return (
    <>
      {messages.map((msg) => (
        <div
          key={msg.id}
          ref={(el) => {
            if (el) {
              messageRefs.current.set(msg.id, el);
            } else {
              messageRefs.current.delete(msg.id);
            }
          }}
          className="w-full min-w-0"
        >
          <div className="p-2">
            {msg.role === "assistant" ? (
              <AssistantMessage message={msg} />
            ) : (
              <UserMessage message={msg} />
            )}
            <DeleteMessageButton
              messageId={msg.id}
              threadId={threadId}
              onDeleteMessage={onDeleteMessage}
              align={msg.role === "user" ? "right" : "left"}
            />
          </div>
        </div>
      ))}
    </>
  );
}
