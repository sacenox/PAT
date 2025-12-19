"use client";

import type { Model } from "@/src/hooks/useModels";

type ThreadSettingsFormProps = {
  models: Model[];
  isLoadingModels: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  maxPromptLength: "none" | 1024 | 4096 | null;
  onMaxPromptLengthChange: (value: "none" | 1024 | 4096 | null) => void;
  userPrompt: string;
  onUserPromptChange: (userPrompt: string) => void;
  isNewThread: boolean;
};

/**
 * Shared form fields for thread settings (both new and existing threads).
 */
export default function ThreadSettingsForm({
  models,
  isLoadingModels,
  selectedModel,
  onModelChange,
  maxPromptLength,
  onMaxPromptLengthChange,
  userPrompt,
  onUserPromptChange,
  isNewThread,
}: ThreadSettingsFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Model</label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={isLoadingModels}
          className="bg-white px-3 py-2 text-neutral-800 focus:outline-none disabled:opacity-50 dark:bg-neutral-950 dark:text-neutral-200"
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
          value={maxPromptLength === null ? "none" : maxPromptLength}
          onChange={(e) =>
            onMaxPromptLengthChange(
              e.target.value === "none" ? null : (parseInt(e.target.value, 10) as 1024 | 4096)
            )
          }
          className="bg-white px-3 py-2 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
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
          value={userPrompt}
          onChange={(e) => onUserPromptChange(e.target.value)}
          placeholder="Additional instructions or information for the assistant..."
          rows={4}
          disabled={!isNewThread}
          className="bg-white px-3 py-2 text-neutral-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-950 dark:text-neutral-200"
        />
        {!isNewThread && (
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            User prompt can only be set when creating a new thread.
          </p>
        )}
      </div>
    </div>
  );
}
