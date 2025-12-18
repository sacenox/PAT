"use client";

import { useState, useEffect } from "react";
import Modal from "@/src/components/Modal";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  themeMode: "device" | "dark" | "light";
  onThemeChange: (mode: "device" | "dark" | "light") => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  maxPromptLength: "none" | 1024 | 4096;
  onMaxPromptLengthChange: (value: "none" | 1024 | 4096) => void;
};

export default function SettingsModal({
  isOpen,
  onClose,
  themeMode,
  onThemeChange,
  selectedModel,
  onModelChange,
  maxPromptLength,
  onMaxPromptLengthChange,
}: SettingsModalProps) {
  const [models, setModels] = useState<Array<{ name: string; model: string }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, selectedModel, onModelChange]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-semibold text-neutral-800 dark:text-neutral-200">
        Settings
      </h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-neutral-600 dark:text-neutral-400">Theme</label>
          <select
            value={themeMode}
            onChange={(e) => onThemeChange(e.target.value as "device" | "dark" | "light")}
            className="bg-neutral-100 px-3 py-1 text-neutral-800 focus:outline-none dark:bg-neutral-900 dark:text-neutral-200"
          >
            <option value="device">Device</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-600 dark:text-neutral-400">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={isLoadingModels}
            className="bg-neutral-100 px-3 py-1 text-neutral-800 focus:outline-none disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-200"
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
          <label className="text-neutral-600 dark:text-neutral-400">Max Prompt Length</label>
          <select
            value={maxPromptLength}
            onChange={(e) =>
              onMaxPromptLengthChange(
                e.target.value === "none" ? "none" : (parseInt(e.target.value, 10) as 1024 | 4096)
              )
            }
            className="bg-neutral-100 px-3 py-1 text-neutral-800 focus:outline-none dark:bg-neutral-900 dark:text-neutral-200"
          >
            <option value="none">None</option>
            <option value="1024">1024</option>
            <option value="4096">4096</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
