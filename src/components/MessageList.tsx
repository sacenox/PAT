"use client";

import { useAppContext } from "@/src/components/App";
import Button from "@/src/components/Button";
import TrashIcon from "@/src/components/icons/TrashIcon";
import useDeleteMessage from "@/src/hooks/api/useDeleteMessage";
import { Message } from "@/src/lib/db/schema";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

function BaseMessage({
  message,
  children,
  justify = "start",
  align = "left",
}: {
  message: Message;
  children: React.ReactNode;
  justify?: "start" | "end";
  align?: "left" | "right";
}) {
  const { mutate: deleteMessage, isPending: isDeletingMessage } = useDeleteMessage(
    message.threadId,
    message.id
  );

  const justifyClass = {
    start: "justify-start",
    end: "justify-end",
  }[justify];

  const alignClass = {
    left: "text-left",
    right: "text-right",
  }[align];

  return (
    <div
      className={`message flex min-w-64 flex-col p-2 text-neutral-500 dark:text-neutral-500 ${justifyClass} ${alignClass}`}
    >
      <div className={`${alignClass}`}>{children}</div>
      <div
        className={`mt-2 flex flex-row items-center gap-0 text-xs ${alignClass} ${justifyClass} text-neutral-600 dark:text-neutral-400`}
      >
        <div>
          on: {message.createdAt?.toLocaleString()} • from: {message.role}
        </div>
        {message.role !== "system" && message.role !== "tool" && (
          <Button inline disabled={isDeletingMessage} onClick={() => deleteMessage()}>
            <TrashIcon className="h-3 w-3" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}

function SystemOrToolMessage({ message }: { message: Message }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <BaseMessage message={message}>
      <pre
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`m-0 cursor-pointer overflow-hidden whitespace-pre-wrap break-words bg-transparent p-0 font-mono text-xs leading-normal text-neutral-500 ${isCollapsed ? "line-clamp-2" : ""}`}
      >
        {message.content}
      </pre>
    </BaseMessage>
  );
}

function UserMessage({ message }: { message: Message }) {
  return (
    <BaseMessage message={message} justify="end" align="right">
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <pre className="whitespace-pre-wrap break-words bg-neutral-300 font-sans text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {message.content}
        </pre>
      </div>
    </BaseMessage>
  );
}

function AssistantMessage({ message }: { message: Message }) {
  const [isCollapsed, setIsCollapsed] = useState(message.id !== 0); // Only show opened optimistic thinking rendered messages
  const { showToolMessages } = useAppContext();

  return (
    <BaseMessage message={message} justify="start" align="left">
      <div className="flex flex-col gap-8">
        {showToolMessages && message.thinking && (
          <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`m-0 cursor-pointer overflow-hidden whitespace-pre-wrap break-words bg-transparent p-0 text-xs leading-normal text-neutral-500 ${isCollapsed ? "line-clamp-2" : ""}`}
          >
            <span className="font-bold">thinking:</span> {message.thinking}
          </div>
        )}
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </BaseMessage>
  );
}

export default function MessageList({
  messages,
  isLoading,
  error,
}: {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      // Scroll the last message into view
      const lastMessageElement = listRef.current.querySelector(".message:last-child");
      if (lastMessageElement) {
        (lastMessageElement as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  return (
    <div className="mx-auto max-w-5xl p-8">
      {isLoading ? (
        <div>Loading messages...</div>
      ) : error ? (
        <div>Error loading messages: {error.message}</div>
      ) : (
        <div ref={listRef} className="flex flex-col gap-8">
          {messages.map((message) =>
            message.role === "system" || message.role === "tool" ? (
              <SystemOrToolMessage key={message.id + message.role} message={message} />
            ) : message.role === "user" ? (
              <UserMessage key={message.id + message.role} message={message} />
            ) : (
              <AssistantMessage key={message.id + message.role} message={message} />
            )
          )}
        </div>
      )}
    </div>
  );
}
