"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon";
import "./highlight-theme.css";

type Thread = {
  id: number;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Message = {
  id: number;
  threadId: number;
  role: string;
  content: string;
  createdAt: Date;
  generationTimeMs: number | null;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [themeMode, setThemeMode] = useState<"device" | "dark" | "light">("device");
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevMessagesLengthRef = useRef<number>(0);

  const applyTheme = (mode: "device" | "dark" | "light") => {
    let shouldBeDark = false;
    if (mode === "device") {
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      shouldBeDark = mode === "dark";
    }

    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const savedMode = localStorage.getItem("themeMode") as "device" | "dark" | "light" | null;
    const mode = savedMode || "device";
    setThemeMode(mode);
    applyTheme(mode);
  }, []);

  useEffect(() => {
    if (themeMode === "device") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("device");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode]);

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const res = await fetch("/api/threads");
        const data = await res.json();
        const threadsList = data.threads || [];
        setThreads(threadsList);

        // Load the most recent thread if available
        if (threadsList.length > 0) {
          const mostRecentThread = threadsList[0];
          setCurrentThreadId(mostRecentThread.id);
          await loadMessages(mostRecentThread.id);
        }
      } catch (error) {
        console.error("Failed to load threads", error);
      }
    };

    loadThreads();
  }, []);

  useEffect(() => {
    // Scroll to the start of the newly added message
    if (messages.length > prevMessagesLengthRef.current) {
      const newMessage = messages[messages.length - 1];
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        const messageElement = messageRefs.current.get(newMessage.id);
        if (messageElement && messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const messageTop = messageElement.offsetTop;
          container.scrollTop = messageTop;
        }
      });
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  const handleThemeChange = (mode: "device" | "dark" | "light") => {
    setThemeMode(mode);
    localStorage.setItem("themeMode", mode);
    applyTheme(mode);
  };

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

  const createNewThread = async (titleOverride?: string): Promise<number | null> => {
    try {
      const title = titleOverride || (input.trim() ? input.substring(0, 20) : "New Thread");
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

  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    let threadId = currentThreadId;
    if (!threadId) {
      // Create a new thread if none exists
      threadId = await createNewThread(input.substring(0, 20));
      if (!threadId) {
        setIsLoading(false);
        return;
      }
    }

    const userMsg: Message = {
      id: Date.now(),
      threadId: threadId!,
      role: "user",
      content: input,
      createdAt: new Date(),
      generationTimeMs: null,
    };
    setMessages((prev) => [...prev, userMsg]);
    const inputValue = input.trim();
    if (!inputValue) return;
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue, threadId }),
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

    setInput("");
    setHistoryIndex(null);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only cycle through user messages, not assistant messages
    const userMessages = messages.filter((m) => m.role === "user");

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = historyIndex ?? userMessages.length;
      if (idx > 0) {
        const newIdx = idx - 1;
        setHistoryIndex(newIdx);
        setInput(userMessages[newIdx].content);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== null) {
        const newIdx = historyIndex + 1;
        if (newIdx < userMessages.length) {
          setHistoryIndex(newIdx);
          setInput(userMessages[newIdx].content);
        } else {
          setHistoryIndex(null);
          setInput("");
        }
      }
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
          <div className="flex min-h-full flex-col justify-end gap-8">
            {threads.length === 0 && messages.length === 0 && currentThreadId === null ? (
              <div className="min-w-0">
                <div className="markdown-content p-1 bg-neutral-200 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {`# Welcome! 👋

I'm your personal assistant. To get started, click the **"New Thread"** button in the sidebar to create your first conversation thread.

Once you've created a thread, you can start chatting with me by typing a message below.`}
                  </ReactMarkdown>
                </div>
              </div>
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
                  className="min-w-0"
                >
                  <div
                    className={`markdown-content p-2 text-neutral-800 dark:text-neutral-200 ${
                      msg.role === "assistant"
                        ? "bg-neutral-200 dark:bg-neutral-900"
                        : "bg-neutral-300 dark:bg-neutral-800 text-right"
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
        <form onSubmit={sendMessage} className="flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3),0_-2px_4px_-1px_rgba(0,0,0,0.2)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Loading answer..." : "Type a message..."}
            disabled={isLoading}
            className="flex-1 bg-neutral-200 px-2 py-2 placeholder:italic placeholder:text-neutral-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-900 dark:placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-900 px-3 py-1 text-neutral-100 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-500 dark:text-neutral-900 dark:hover:bg-green-600"
          >
            <PaperPlaneIcon className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </form>
      </div>
      <div className="w-64 bg-neutral-200 p-1 dark:bg-neutral-900">
        <div className="flex flex-col gap-2 p-4">
          <button
            onClick={() => createNewThread()}
            className="bg-green-900 px-1 py-1 text-neutral-100 hover:bg-green-800 dark:bg-green-500 dark:text-neutral-900 dark:hover:bg-green-600"
          >
            New Thread
          </button>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Threads</label>
            <select
              value={currentThreadId || ""}
              onChange={(e) => {
                const threadId = e.target.value ? parseInt(e.target.value) : null;
                if (threadId) {
                  handleThreadSelect(threadId);
                }
              }}
              className="bg-neutral-100 px-3 py-1 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
            >
              <option value="">Select a thread...</option>
              {threads.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.title || `Thread ${thread.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Theme</label>
            <select
              value={themeMode}
              onChange={(e) => handleThemeChange(e.target.value as "device" | "dark" | "light")}
              className="bg-neutral-100 px-3 py-1 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
            >
              <option value="device">Device</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
