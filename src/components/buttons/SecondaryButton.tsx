"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Children } from "react";

type SecondaryButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  isSelected?: boolean;
  disabled?: boolean;
};

// SecondaryButton: A reusable button component with neutral hover and selection states.
// When selected (isSelected=true), displays a neutral-800 background (dark) or neutral-200 (light).
// On hover, displays a neutral-700 background (dark) or neutral-300 (light).
export default function SecondaryButton({
  children,
  isSelected = false,
  disabled = false,
  className = "",
  onClick,
  ...props
}: SecondaryButtonProps) {
  // Process children to wrap text nodes in a truncating span
  const processedChildren = Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      return <span className="min-w-0 truncate">{child}</span>;
    }
    return child;
  });

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <a
      className={`flex min-w-0 items-center gap-2 rounded px-2 py-1 ${
        isSelected
          ? "bg-neutral-200 dark:bg-neutral-800"
          : "hover:bg-neutral-300 dark:hover:bg-neutral-700"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {processedChildren}
    </a>
  );
}
