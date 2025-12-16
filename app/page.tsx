"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon";
import "highlight.js/styles/nord.css";

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
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [themeMode, setThemeMode] = useState<"device" | "dark" | "light">("device");
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initial scroll to bottom
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const handleThemeChange = (mode: "device" | "dark" | "light") => {
    setThemeMode(mode);
    localStorage.setItem("themeMode", mode);
    applyTheme(mode);
  };

  const loadMessages = async (threadId: number) => {
    try {
      const res = await fetch(`/api/threads/${threadId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const createNewThread = async () => {
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Thread" }),
      });
      const data = await res.json();
      const newThread = data.thread;
      setCurrentThreadId(newThread.id);
      setMessages([]);
      // Reload threads to get the full list
      const threadsRes = await fetch("/api/threads");
      const threadsData = await threadsRes.json();
      setThreads(threadsData.threads || []);
    } catch (error) {
      console.error("Failed to create thread", error);
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
      try {
        const res = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: input.substring(0, 50) }),
        });
        const data = await res.json();
        threadId = data.thread.id;
        setCurrentThreadId(threadId);
        setMessages([]);
        // Reload threads to ensure UI is in sync
        const threadsRes = await fetch("/api/threads");
        const threadsData = await threadsRes.json();
        setThreads(threadsData.threads || []);
      } catch (error) {
        console.error("Failed to create thread", error);
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
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const userMessages = messages.filter((m) => m.role === "user");
      const idx = historyIndex ?? userMessages.length;
      if (idx > 0) {
        const newIdx = idx - 1;
        setHistoryIndex(newIdx);
        setInput(userMessages[newIdx].content);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== null) {
        const userMessages = messages.filter((m) => m.role === "user");
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

  return (
    <div className="flex h-screen bg-stone-100 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          ref={messagesContainerRef}
          className="text-sm pt-2 px-2 flex-1 overflow-y-auto overflow-x-hidden bg-stone-100 dark:bg-stone-950"
        >
          <div className="flex min-h-full flex-col justify-end gap-3">
            {threads.length === 0 && messages.length === 0 && currentThreadId === null ? (
              <div className="min-w-0">
                <div className="markdown-content p-1 bg-stone-200 text-stone-800 dark:bg-stone-900 dark:text-stone-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {`# Welcome! 👋

I'm your personal assistant. To get started, click the **"New Thread"** button in the sidebar to create your first conversation thread.

Once you've created a thread, you can start chatting with me by typing a message below.`}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="min-w-0">
                  <div
                    className={`markdown-content p-1 text-stone-800 dark:text-stone-200 ${
                      msg.role === "assistant"
                        ? "bg-stone-200 dark:bg-stone-900"
                        : "bg-stone-300 dark:bg-stone-800"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="text-right">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <form onSubmit={sendMessage} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Loading answer..." : "Type a message..."}
            disabled={isLoading}
            className="flex-1 bg-stone-200 px-2 py-2 placeholder:italic placeholder:text-stone-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-stone-900 dark:placeholder:text-stone-400"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-900 px-3 py-1 text-stone-100 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-500 dark:text-stone-900 dark:hover:bg-green-600"
          >
            <PaperPlaneIcon className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </form>
      </div>
      <div className="w-64 bg-stone-200 p-1 dark:bg-stone-900">
        <div className="flex flex-col gap-2">
          <button
            onClick={createNewThread}
            className="bg-green-900 px-1 py-1 text-stone-100 hover:bg-green-800 dark:bg-green-500 dark:text-stone-900 dark:hover:bg-green-600"
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
              className="bg-stone-100 px-1 py-1 text-stone-800 focus:outline-none dark:bg-stone-950 dark:text-stone-200"
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
              className="bg-stone-100 px-1 py-1 text-stone-800 focus:outline-none dark:bg-stone-950 dark:text-stone-200"
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
