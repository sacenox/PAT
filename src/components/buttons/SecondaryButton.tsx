"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isSelected?: boolean;
};

// SecondaryButton: A neutral, compact button styled for sidebar selections.
// When selected (isSelected=true), displays a green border and a neutral background.
// When not selected, uses neutral backgrounds and no border, maintaining visual simplicity.
// Designed to fit project style with neutral color palette and color-coded borders only on selection.
export default function SecondaryButton({
  children,
  isSelected = false,
  className = "",
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      className={`border-2 px-3 py-2 text-left hover:bg-neutral-300 dark:hover:bg-neutral-800 ${
        isSelected
          ? "border-green-900 bg-neutral-300 dark:border-green-500 dark:bg-neutral-800"
          : "border-transparent bg-neutral-100 dark:bg-neutral-950"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

