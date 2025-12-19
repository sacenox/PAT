"use client";

import { useState, useEffect } from "react";
import Modal from "@/src/components/Modal";
import SecondaryButton from "@/src/components/buttons/SecondaryButton";
import TrashIcon from "@/src/components/icons/TrashIcon";
import type { Thread } from "@/src/lib/db/schema";

type ThreadSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  thread: Thread | null;
  onUpdateThread?: (
    threadId: number,
    updates: {
      model?: string;
      maxPromptLength?: "none" | 1024 | 4096 | null;
      userPrompt?: string | null;
    }
  ) => Promise<void>;
  onDeleteThread?: (threadId: number) => Promise<void>;
  onError?: (error: string) => void;
  initialModel?: string;
  initialMaxPromptLength?: "none" | 1024 | 4096;
  initialUserPrompt?: string;
  onModelChange?: (model: string) => void;
  onMaxPromptLengthChange?: (value: "none" | 1024 | 4096) => void;
  onUserPromptChange?: (userPrompt: string) => void;
};

export default function ThreadSettingsModal({
  isOpen,
  onClose,
  thread,
  onUpdateThread,
  onDeleteThread,
  onError,
  initialModel,
  initialMaxPromptLength,
  initialUserPrompt,
  onModelChange,
  onMaxPromptLengthChange,
  onUserPromptChange,
}: ThreadSettingsModalProps) {
  const [models, setModels] = useState<Array<{ name: string; model: string }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-oss");
  const [maxPromptLength, setMaxPromptLength] = useState<"none" | 1024 | 4096 | null>("none");
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isNewThread = thread === null;

  // Load models when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingModels(true);
      fetch("/api/models")
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch((parseError) => {
              throw new Error(
                `Failed to parse error response: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`
              );
            });
            throw new Error(errorData.error || res.statusText);
          }
          return res.json();
        })
        .then((data) => {
          const availableModels = data.models || [];
          setModels(availableModels);
          setIsLoadingModels(false);
        })
        .catch((error) => {
          setIsLoadingModels(false);
          if (onError && error instanceof Error) {
            onError(error.message);
          }
        });
    }
  }, [isOpen, onError]);

  // Load thread settings when thread changes or when modal opens for new thread
  useEffect(() => {
    if (thread) {
      setSelectedModel(thread.model || "gpt-oss");
      setMaxPromptLength(
        thread.maxPromptLength === null ? "none" : (thread.maxPromptLength as 1024 | 4096)
      );
      setUserPrompt(thread.userPrompt || "");
    } else if (isOpen && isNewThread) {
      // For new thread, use initial values or defaults
      setSelectedModel(initialModel || "gpt-oss");
      setMaxPromptLength(initialMaxPromptLength || "none");
      setUserPrompt(initialUserPrompt || "");
    }
  }, [thread, isOpen, isNewThread, initialModel, initialMaxPromptLength, initialUserPrompt]);

  const handleSave = async () => {
    if (isNewThread) {
      // For new thread, just update the parent's state
      if (onModelChange) {
        onModelChange(selectedModel);
      }
      if (onMaxPromptLengthChange && maxPromptLength !== null) {
        onMaxPromptLengthChange(maxPromptLength === "none" ? "none" : maxPromptLength);
      }
      if (onUserPromptChange) {
        onUserPromptChange(userPrompt);
      }
      onClose();
      return;
    }

    if (!thread || !onUpdateThread) return;

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
      // Don't send userPrompt for existing threads - it's read-only
      await onUpdateThread(thread.id, {
        model: selectedModel,
        maxPromptLength: maxPromptLength === "none" ? null : maxPromptLength,
      });
      onClose();
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!thread || !onDeleteThread) return;

    setIsDeleting(true);
    try {
      await onDeleteThread(thread.id);
      onClose();
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const threadTitle = thread ? thread.title || `Thread ${thread.id}` : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {isNewThread ? "New Thread Settings" : "Thread Settings"}
        </h2>
        {threadTitle && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{threadTitle}</p>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
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
                setMaxPromptLength(
                  e.target.value === "none" ? "none" : (parseInt(e.target.value, 10) as 1024 | 4096)
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
              onChange={(e) => setUserPrompt(e.target.value)}
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

        <div className="flex justify-between gap-2 border-t border-neutral-300 pt-4 dark:border-neutral-700">
          {!isNewThread && onDeleteThread && (
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
          )}
          {isNewThread && <div />}
          <div className="flex gap-2">
            <SecondaryButton
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              disabled={isSaving || isDeleting}
              color="neutral"
            >
              {isSaving ? "Saving..." : "Save"}
            </SecondaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}
