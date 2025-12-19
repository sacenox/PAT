"use client";

import { useState, useEffect, useMemo } from "react";
import Modal from "@/src/components/Modal";
import SecondaryButton from "@/src/components/buttons/SecondaryButton";
import TrashIcon from "@/src/components/icons/TrashIcon";
import ThreadSettingsForm from "@/src/components/ThreadSettingsForm";
import type { Thread } from "@/src/lib/db/schema";
import { useModels } from "@/src/hooks/useModels";
import { handleError } from "@/src/lib/errors";

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
  const { models, isLoading: isLoadingModels } = useModels(onError);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-oss");
  const [maxPromptLength, setMaxPromptLength] = useState<"none" | 1024 | 4096 | null>("none");
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isNewThread = thread === null;

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

  const hasChanges = useMemo(() => {
    if (isNewThread) return true;
    if (!thread) return false;
    return (
      selectedModel !== (thread.model || "gpt-oss") ||
      maxPromptLength !==
        (thread.maxPromptLength === null ? "none" : (thread.maxPromptLength as 1024 | 4096))
    );
  }, [isNewThread, thread, selectedModel, maxPromptLength]);

  const handleSave = async () => {
    if (isNewThread) {
      onModelChange?.(selectedModel);
      if (maxPromptLength !== null) {
        onMaxPromptLengthChange?.(maxPromptLength === "none" ? "none" : maxPromptLength);
      }
      onUserPromptChange?.(userPrompt);
      onClose();
      return;
    }

    if (!thread || !onUpdateThread || !hasChanges) {
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
      handleError(error, onError);
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
      handleError(error, onError);
    } finally {
      setIsDeleting(false);
    }
  };

  const threadTitle = useMemo(
    () => (thread ? thread.title || `Thread ${thread.id}` : null),
    [thread]
  );

  const handleModelChange = (model: string) => setSelectedModel(model);
  const handleMaxPromptLengthChange = (value: "none" | 1024 | 4096 | null) =>
    setMaxPromptLength(value);
  const handleUserPromptChange = (prompt: string) => setUserPrompt(prompt);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {isNewThread ? "New Thread Settings" : "Thread Settings"}
        </h2>
        {threadTitle && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{threadTitle}</p>
        )}

        <ThreadSettingsForm
          models={models}
          isLoadingModels={isLoadingModels}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          maxPromptLength={maxPromptLength}
          onMaxPromptLengthChange={handleMaxPromptLengthChange}
          userPrompt={userPrompt}
          onUserPromptChange={handleUserPromptChange}
          isNewThread={isNewThread}
        />

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
