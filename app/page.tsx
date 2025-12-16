"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import PaperPlaneIcon from "../src/components/icons/PaperPlaneIcon";
import "highlight.js/styles/nord.css";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isDark, setIsDark] = useState(false);
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
    const buildWelcomeMessage = async () => {
      const parts: string[] = [];

      // User agent information
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      parts.push(`**User Agent:** ${userAgent}`);
      parts.push(`**Platform:** ${platform}`);

      // Location information
      if (navigator.geolocation) {
        // Check permission state first if available
        let permissionState = "unknown";
        if (navigator.permissions) {
          try {
            const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
            permissionState = permission.state;
          } catch (e) {
            // Permissions API might not support geolocation query
          }
        }

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { 
                timeout: 10000,
                enableHighAccuracy: false,
                maximumAge: 60000
              }
            );
          });
          const { latitude, longitude } = position.coords;
          parts.push(`**Location:** ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch (error: any) {
          let errorMsg = "Unable to retrieve";
          if (error?.code === 1) {
            errorMsg = permissionState === "prompt" ? "Permission prompt shown" : "Permission denied";
          } else if (error?.code === 2) {
            errorMsg = "Position unavailable";
          } else if (error?.code === 3) {
            errorMsg = "Request timeout";
          } else if (error?.message) {
            errorMsg = error.message;
          }
          parts.push(`**Location:** ${errorMsg} (permission: ${permissionState})`);
        }
      } else {
        parts.push(`**Location:** Geolocation not supported`);
      }

      // Local time
      const now = new Date();
      const timeString = now.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
      parts.push(`**Local Time:** ${timeString}`);

      const message = parts.join('\n\n');
      setMessages([{ role: "assistant", content: message }]);
    };

    buildWelcomeMessage();
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
      <div className="flex-1 flex flex-col min-w-0">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-200 dark:bg-slate-900"
        >
          <div className="flex flex-col justify-end min-h-full">
            {messages.map((msg, i) => (
              <div
                key={i}
                className="min-w-0"
              >
                <div
                  className="p-2 m-2 bg-slate-300 dark:bg-slate-950 text-slate-800 dark:text-slate-200 markdown-content"
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-right">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
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
