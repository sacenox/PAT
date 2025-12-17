"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import BasicButton from "./BasicButton";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

// PrimaryButton: Main action button (submit/send/etc.), styled with project primary color.
// Uses green-900 (light mode) and green-500 (dark mode) as background;
// white text in light mode, dark text in dark mode. Transitions to a lighter green on hover.
// Disabled state lowers opacity and disables cursor interaction.
export default function PrimaryButton({ children, className = "", ...props }: PrimaryButtonProps) {
  return (
    <BasicButton color="green" className={className} {...props}>
      {children}
    </BasicButton>
  );
}
