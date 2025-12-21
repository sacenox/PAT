"use client";

import type { Model } from "@/src/hooks/api/useModels";
import { useAppContext } from "@/src/components/App";
import { Switch } from "@/src/components/Switch";
import { useAutoResizeTextarea } from "@/src/hooks/useAutoResizeTextarea";

export default function SettingsForm() {
  const {
    themeMode,
    handleThemeChange,
    isModelsLoading,
    models,
    modelsError,
    selectedModel,
    setSelectedModel,
    maxPromptLength,
    setMaxPromptLength,
    userPrompt,
    setUserPrompt,
    showSystemMessages,
    setShowSystemMessages,
    showToolMessages,
    setShowToolMessages,
  } = useAppContext();

  const textareaRef = useAutoResizeTextarea(userPrompt);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Theme</label>
        <select
          value={themeMode}
          onChange={(e) => handleThemeChange(e.target.value as "device" | "dark" | "light")}
          className="rounded-md bg-white px-4 py-2 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
        >
          <option value="device">Device</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Model</label>
        {isModelsLoading ? (
          <p>Loading models...</p>
        ) : modelsError ? (
          <p>Error loading models: {modelsError.message}</p>
        ) : models.length === 0 ? (
          <p>No models available</p>
        ) : (
          <select
            value={selectedModel?.name}
            onChange={(e) =>
              setSelectedModel(models.find((model) => model.name === e.target.value) as Model)
            }
            className="rounded-md bg-white px-4 py-2 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
          >
            {models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Max Prompt Length
        </label>
        <select
          value={maxPromptLength ?? "none"}
          onChange={(e) =>
            setMaxPromptLength(e.target.value === "none" ? null : parseInt(e.target.value, 10))
          }
          className="rounded-md bg-white px-4 py-2 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
        >
          <option value="none">None</option>
          <option value="1024">1024</option>
          <option value="4096">4096</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          User Prompt
        </label>
        <textarea
          ref={textareaRef}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          className="resize-none rounded-md bg-white px-4 py-2 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
        />
      </div>

      <div className="flex flex-row items-center gap-2">
        <label className="block min-w-64">Show System Messages</label>
        <Switch
          checked={showSystemMessages}
          onChange={(e) => setShowSystemMessages(e.target.checked)}
        />
      </div>

      <div className="flex flex-row items-center gap-2">
        <label className="block min-w-64">Show Tool Messages</label>
        <Switch
          checked={showToolMessages}
          onChange={(e) => setShowToolMessages(e.target.checked)}
        />
      </div>
    </div>
  );
}
