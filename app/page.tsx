"use client";
import { useState, useEffect } from "react";
import PaperPlaneIcon from "../src/components/icons/PaperPlaneIcon";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  const [input, setInput] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    setIsDark(darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
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

  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    const botMsg = { role: "assistant", content: data.answer || "" };
    setMessages((prev) => [...prev, botMsg]);

    setInput("");
    setHistoryIndex(null);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = historyIndex ?? messages.length;
      if (idx > 0) {
        const newIdx = idx - 1;
        setHistoryIndex(newIdx);
        setInput(messages[newIdx].content);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== null) {
        const newIdx = historyIndex + 1;
        if (newIdx < messages.length) {
          setHistoryIndex(newIdx);
          setInput(messages[newIdx].content);
        } else {
          setHistoryIndex(null);
          setInput("");
        }
      }
    }
  };

  return (
    <div className="h-screen flex bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 bg-slate-200 dark:bg-slate-900">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-3 flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-xs p-3 ${
                  msg.role === "assistant"
                    ? "bg-emerald-900 dark:bg-emerald-500 text-slate-100 dark:text-slate-900"
                    : "bg-indigo-700 dark:bg-indigo-500 text-slate-100 dark:text-slate-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-slate-300 dark:bg-slate-950 placeholder:italic placeholder:text-slate-600 dark:placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-900 dark:bg-emerald-500 text-slate-100 dark:text-slate-900 hover:bg-emerald-800 dark:hover:bg-emerald-600"
          >
            <PaperPlaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
      <div className="w-64 bg-slate-300 dark:bg-slate-950 p-4">
        <div className="flex items-center justify-between">
          <span>Dark Mode</span>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center transition-colors ${
              isDark ? "bg-indigo-500" : "bg-slate-400"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform bg-slate-200 dark:bg-slate-100 transition-transform ${
                isDark ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
