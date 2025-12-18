"use client";

import Modal from "@/src/components/Modal";
import SecondaryButton from "@/src/components/buttons/SecondaryButton";
import PrimaryButton from "@/src/components/buttons/PrimaryButton";

type DeleteConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  isDeleting?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
};

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: DeleteConfirmationModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-neutral-600 dark:text-neutral-400">{message}</p>
        <div className="flex justify-end gap-2">
          <SecondaryButton
            onClick={(e) => {
              e.preventDefault();
              if (!isDeleting) {
                onClose();
              }
            }}
          >
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            color="red"
          >
            {isDeleting ? "Deleting..." : confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
