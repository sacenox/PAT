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
  const [isDark, setIsDark] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    setIsDark(darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

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

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
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
    if (!input.trim()) return;

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
    <div className="flex h-screen bg-slate-200 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-200 dark:bg-slate-900"
        >
          <div className="flex min-h-full flex-col justify-end">
            {threads.length === 0 && messages.length === 0 && currentThreadId === null ? (
              <div className="min-w-0">
                <div className="markdown-content m-1 p-1 bg-slate-300 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
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
                  <div className="markdown-content m-1 p-1 bg-slate-300 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
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
            placeholder="Type a message..."
            className="flex-1 bg-slate-300 px-3 py-2 placeholder:italic placeholder:text-slate-600 focus:outline-none dark:bg-slate-950 dark:placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="bg-emerald-900 px-4 py-2 text-slate-100 hover:bg-emerald-800 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-600"
          >
            <PaperPlaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
      <div className="w-64 bg-slate-300 p-4 dark:bg-slate-950">
        <div className="flex flex-col gap-4">
          <button
            onClick={createNewThread}
            className="bg-emerald-900 px-3 py-2 text-slate-100 hover:bg-emerald-800 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-600"
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
              className="bg-slate-200 px-2 py-1 text-slate-800 focus:outline-none dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">Select a thread...</option>
              {threads.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.title || `Thread ${thread.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span>Dark Mode</span>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center transition-colors ${
                isDark ? "bg-indigo-500" : "bg-slate-400"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform bg-slate-200 transition-transform dark:bg-slate-100 ${
                  isDark ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
