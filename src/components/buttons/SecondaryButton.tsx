"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import BasicButton from "./BasicButton";

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
    <BasicButton color="neutral" className={className} {...props}>
      {children}
    </BasicButton>
  );
}
