"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type AlternateButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

// AlternateButton: A compact sidebar/action button using an alternate indigo color palette.
// Indigo-200 background with indigo-900 text for light mode, indigo-950 background with indigo-200 text for dark mode.
// Designed for sidebar action buttons that shouldn't use the primary project green.
// Slightly padded, with gentle color transitions on hover for accessible secondary actions.
export default function AlternateButton({
  children,
  className = "",
  ...props
}: AlternateButtonProps) {
  return (
    <button
      className={`flex items-center justify-center gap-1 bg-indigo-200 px-1 py-1 text-indigo-900 hover:bg-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:hover:bg-indigo-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

