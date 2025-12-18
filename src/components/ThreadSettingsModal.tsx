"use client";

import { useState, useEffect } from "react";
import Modal from "@/src/components/Modal";
import SecondaryButton from "@/src/components/buttons/SecondaryButton";
import PrimaryButton from "@/src/components/buttons/PrimaryButton";
import TrashIcon from "@/src/components/icons/TrashIcon";
import type { Thread } from "@/src/lib/db/schema";

type ThreadSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  thread: Thread | null;
  onUpdateThread: (
    threadId: number,
    updates: { model?: string; maxPromptLength?: "none" | 1024 | 4096 | null }
  ) => Promise<void>;
  onDeleteThread: (threadId: number) => Promise<void>;
};

export default function ThreadSettingsModal({
  isOpen,
  onClose,
  thread,
  onUpdateThread,
  onDeleteThread,
}: ThreadSettingsModalProps) {
  const [models, setModels] = useState<Array<{ name: string; model: string }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-oss");
  const [maxPromptLength, setMaxPromptLength] = useState<"none" | 1024 | 4096 | null>("none");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load models when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingModels(true);
      fetch("/api/models")
        .then((res) => res.json())
        .then((data) => {
          const availableModels = data.models || [];
          setModels(availableModels);
          setIsLoadingModels(false);
        })
        .catch((error) => {
          console.error("Failed to load models", error);
          setIsLoadingModels(false);
        });
    }
  }, [isOpen]);

  // Load thread settings when thread changes
  useEffect(() => {
    if (thread) {
      setSelectedModel(thread.model || "gpt-oss");
      setMaxPromptLength(
        thread.maxPromptLength === null ? "none" : (thread.maxPromptLength as 1024 | 4096)
      );
    }
  }, [thread]);

  const handleSave = async () => {
    if (!thread) return;

    const hasChanges =
      selectedModel !== (thread.model || "gpt-oss") ||
      maxPromptLength !==
        (thread.maxPromptLength === null ? "none" : (thread.maxPromptLength as 1024 | 4096));

    // If there are no changes, just close the modal
    if (!hasChanges) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateThread(thread.id, {
        model: selectedModel,
        maxPromptLength: maxPromptLength === "none" ? null : maxPromptLength,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update thread settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!thread) return;

    setIsDeleting(true);
    try {
      await onDeleteThread(thread.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete thread", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!thread) {
    return null;
  }

  const threadTitle = thread.title || `Thread ${thread.id}`;
  const hasChanges =
    selectedModel !== (thread.model || "gpt-oss") ||
    maxPromptLength !==
      (thread.maxPromptLength === null ? "none" : (thread.maxPromptLength as 1024 | 4096));

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Thread Settings</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{threadTitle}</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
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
              value={maxPromptLength === null ? "none" : maxPromptLength}
              onChange={(e) =>
                setMaxPromptLength(
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

        <div className="flex justify-between gap-2 border-t border-neutral-300 pt-4 dark:border-neutral-700">
          <SecondaryButton
            onClick={(e) => {
              e.preventDefault();
              if (!isDeleting && !isSaving) {
                handleDelete();
              }
            }}
            className={isDeleting || isSaving ? "cursor-not-allowed opacity-50" : ""}
          >
            <TrashIcon className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Thread"}
          </SecondaryButton>
          <div className="flex gap-2">
            <PrimaryButton
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? "Saving..." : "Save"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}
