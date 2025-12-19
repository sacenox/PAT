"use client";

import { useState } from "react";
import TrashIcon from "@/src/components/icons/TrashIcon";
import DeleteConfirmationModal from "@/src/components/DeleteConfirmationModal";
import { handleError } from "@/src/lib/errors";

type DeleteThreadButtonProps = {
  threadId: number;
  threadTitle: string;
  onDeleteThread: (threadId: number) => void;
  onError?: (error: string) => void;
};

export default function DeleteThreadButton({
  threadId,
  threadTitle,
  onDeleteThread,
  onError,
}: DeleteThreadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteThread(threadId);
      setIsModalOpen(false);
    } catch (error) {
      handleError(error, onError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className="flex items-center justify-center rounded p-1 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        aria-label="Delete thread"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Thread"
        message={`Are you sure you want to delete "${threadTitle || `Thread ${threadId}`}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </>
  );
}
