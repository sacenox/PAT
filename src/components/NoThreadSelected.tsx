"use client";

import { useState, useEffect } from "react";

type NoThreadSelectedProps = {
  threadCount: number;
  selectedModel: string;
  onModelChange: (model: string) => void;
  maxPromptLength: "none" | 1024 | 4096;
  onMaxPromptLengthChange: (value: "none" | 1024 | 4096) => void;
};

export default function NoThreadSelected({
  threadCount,
  selectedModel,
  onModelChange,
  maxPromptLength,
  onMaxPromptLengthChange,
}: NoThreadSelectedProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [models, setModels] = useState<Array<{ name: string; model: string }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    // Set initial time only on client side to avoid hydration mismatch
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsLoadingModels(true);
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        const availableModels = data.models || [];
        setModels(availableModels);

        // Validate selected model against available models
        if (availableModels.length > 0) {
          const modelExists = availableModels.some(
            (m: { name: string; model: string }) => m.model === selectedModel
          );

          if (!modelExists) {
            // Selected model doesn't exist, fall back to first available
            const fallbackModel = availableModels[0].model;
            onModelChange(fallbackModel);
          }
        }

        setIsLoadingModels(false);
      })
      .catch((error) => {
        console.error("Failed to load models", error);
        setIsLoadingModels(false);
      });
  }, [selectedModel, onModelChange]);

  const formatTime = (date: Date): string => {
    return date.toLocaleString();
  };

  const timeDisplay = currentTime ? formatTime(currentTime) : "";

  return (
    <div className="mx-auto min-w-0 max-w-5xl">
      <div className="flex flex-col gap-4 bg-neutral-200 p-8 dark:bg-neutral-900">
        <h1 className="text-4xl font-bold">Hello, I'm PAT 👋</h1>
        <p>
          <strong>PAT</strong> (Personal Assistant Thing) is your personal assistant. Start typing
          below to start new a conversation thread or pick a previous conversation thread from the
          sidebar.
        </p>
        <hr className="border-neutral-300 dark:border-neutral-700" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={isLoadingModels}
              className="bg-neutral-100 px-3 py-2 text-neutral-800 focus:outline-none disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-200"
            >
              {isLoadingModels ? (
                <option>Loading models...</option>
              ) : models.length === 0 ? (
                <option>No models available</option>
              ) : (
                models.map((model) => (
                  <option key={model.name} value={model.model}>
                    {model.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Max Prompt Length
            </label>
            <select
              value={maxPromptLength}
              onChange={(e) =>
                onMaxPromptLengthChange(
                  e.target.value === "none" ? "none" : (parseInt(e.target.value, 10) as 1024 | 4096)
                )
              }
              className="bg-neutral-100 px-3 py-2 text-neutral-800 focus:outline-none dark:bg-neutral-900 dark:text-neutral-200"
            >
              <option value="none">None</option>
              <option value="1024">1024</option>
              <option value="4096">4096</option>
            </select>
          </div>
        </div>
        <hr className="border-neutral-300 dark:border-neutral-700" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {timeDisplay && (
            <>
              <em>Current time: {timeDisplay}</em>
              <br />
            </>
          )}
          <em>
            {threadCount} {threadCount === 1 ? "thread" : "threads"} created
          </em>
        </p>
      </div>
    </div>
  );
}
