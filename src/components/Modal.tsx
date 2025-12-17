"use client";

import { useEffect, type ReactNode } from "react";
import XIcon from "@/src/components/icons/XIcon";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} aria-hidden="true" />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-neutral-50 p-6 shadow-lg dark:bg-neutral-900">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label="Close modal"
        >
          <XIcon className="h-5 w-5" />
        </button>
        {/* Content */}
        <div className="pr-8">{children}</div>
      </div>
    </div>
  );
}
