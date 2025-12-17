"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Children, isValidElement } from "react";

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  isSelected?: boolean;
};

// Anchor: A reusable anchor component with neutral hover and selection states.
// When selected (isSelected=true), displays a neutral-800 background (dark) or neutral-200 (light).
// On hover, displays a neutral-700 background (dark) or neutral-300 (light).
export default function Anchor({
  children,
  isSelected = false,
  className = "",
  ...props
}: AnchorProps) {
  // Process children to wrap text nodes in a truncating span
  const processedChildren = Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      return <span className="min-w-0 truncate">{child}</span>;
    }
    return child;
  });

  return (
    <a
      className={`flex items-center gap-1 min-w-0 px-2 py-1 rounded ${
        isSelected
          ? "bg-neutral-200 dark:bg-neutral-800"
          : "hover:bg-neutral-300 dark:hover:bg-neutral-700"
      } ${className}`}
      {...props}
    >
      {processedChildren}
    </a>
  );
}

