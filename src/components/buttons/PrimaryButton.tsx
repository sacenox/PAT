"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

// PrimaryButton: Main action button (submit/send/etc.), styled with project primary color.
// Uses green-900 (light mode) and green-500 (dark mode) as background;
// white text in light mode, dark text in dark mode. Transitions to a lighter green on hover.
// Disabled state lowers opacity and disables cursor interaction.
export default function PrimaryButton({
  children,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={`bg-green-900 px-3 py-1 text-neutral-100 hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:text-neutral-900 dark:hover:bg-green-600 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

