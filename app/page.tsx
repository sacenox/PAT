"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import Sidebar from "@/src/components/Sidebar";
import MessageInput, { type MessageInputRef } from "@/src/components/MessageInput";
import NoThreadSelected from "@/src/components/NoThreadSelected";
import { useTheme } from "@/src/hooks/useTheme";
import type { Thread, Message } from "@/src/types";
import "./highlight-theme.css";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { themeMode, handleThemeChange } = useTheme();
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevMessagesLengthRef = useRef<number>(0);
  const messageInputRef = useRef<MessageInputRef>(null);


  useEffect(() => {
    const loadThreads = async () => {
      try {
        const res = await fetch("/api/threads");
        const data = await res.json();
        const threadsList = data.threads || [];
        setThreads(threadsList);
      } catch (error) {
        console.error("Failed to load threads", error);
      }
    };

    loadThreads();
  }, []);

  useEffect(() => {
    // Scroll to top when a thread is selected
    if (currentThreadId !== null && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [currentThreadId]);

  useEffect(() => {
    // Scroll to the start of the newly added message
    if (messages.length > prevMessagesLengthRef.current) {
      const newMessage = messages[messages.length - 1];
      const messageElement = messageRefs.current.get(newMessage.id);
      if (messageElement) {
        messageElement.scrollIntoView({ block: "start", behavior: "instant" });
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);


  const loadMessages = async (threadId: number) => {
    try {
      const res = await fetch(`/api/threads/${threadId}/messages`);
      const data = await res.json();
      const loadedMessages = data.messages || [];
      setMessages(loadedMessages);
      prevMessagesLengthRef.current = loadedMessages.length;
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const createNewThread = async (titleOverride?: string, firstMessage?: string): Promise<number | null> => {
    try {
      const title = titleOverride || (firstMessage ? firstMessage.substring(0, 100) : "New Thread");
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      const newThread = data.thread;
      setCurrentThreadId(newThread.id);
      setMessages([]);
      prevMessagesLengthRef.current = 0;
      // Reload threads to get the full list
      const threadsRes = await fetch("/api/threads");
      const threadsData = await threadsRes.json();
      setThreads(threadsData.threads || []);
      return newThread.id;
    } catch (error) {
      console.error("Failed to create thread", error);
      return null;
    }
  };

  const handleThreadSelect = (threadId: number) => {
    setCurrentThreadId(threadId);
    loadMessages(threadId);
  };

  const handleCreateNewThread = () => {
    setCurrentThreadId(null);
    setMessages([]);
    prevMessagesLengthRef.current = 0;
    // Focus the input after a short delay to ensure DOM has updated
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    let threadId = currentThreadId;
    if (!threadId) {
      // Create a new thread if none exists
      threadId = await createNewThread(message.substring(0, 100), message);
      if (!threadId) {
        setIsLoading(false);
        return;
      }
    }

    const userMsg: Message = {
      id: Date.now(),
      threadId: threadId!,
      role: "user",
      content: message,
      createdAt: new Date(),
      generationTimeMs: null,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), threadId }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: Date.now() + 1,
        threadId: threadId!,
        role: "assistant",
        content: data.answer || "",
        createdAt: new Date(),
        generationTimeMs: null,
      };
      setMessages((prev) => [...prev, botMsg]);

      // Reload messages to get correct IDs from database
      await loadMessages(threadId!);

      // Reload threads to update the order
      const threadsRes = await fetch("/api/threads");
      const threadsData = await threadsRes.json();
      setThreads(threadsData.threads || []);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString();
  };

  const formatGenerationTime = (ms: number | null): string => {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex h-screen bg-neutral-100 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          ref={messagesContainerRef}
          className="text-sm p-4 flex-1 overflow-y-auto overflow-x-hidden bg-neutral-100 dark:bg-neutral-950"
        >
          <div className="flex min-h-full flex-col justify-end gap-8 max-w-4xl mx-auto">
            {currentThreadId === null ? (
              <NoThreadSelected threadCount={threads.length} />
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  ref={(el) => {
                    if (el) {
                      messageRefs.current.set(msg.id, el);
                    } else {
                      messageRefs.current.delete(msg.id);
                    }
                  }}
                  className="min-w-0 w-full"
                >
                  <div
                    className={`p-2 ${
                      msg.role === "assistant"
                        ? "bg-neutral-200 dark:bg-neutral-900 prose prose-neutral dark:prose-invert max-w-none"
                        : "bg-neutral-300 dark:bg-neutral-800 text-right w-1/2 min-w-64 ml-auto"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <div>{msg.content}</div>
                    )}
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      sent on: {formatTimestamp(msg.createdAt)}
                      {msg.role === "assistant" && msg.generationTimeMs && (
                        <span className="ml-2">• generated in {formatGenerationTime(msg.generationTimeMs)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <MessageInput ref={messageInputRef} isLoading={isLoading} messages={messages} onSubmit={sendMessage} />
      </div>
      <Sidebar
        threads={threads}
        currentThreadId={currentThreadId}
        themeMode={themeMode}
        onCreateNewThread={handleCreateNewThread}
        onThreadSelect={handleThreadSelect}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}
