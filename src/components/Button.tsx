"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Children } from "react";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  isSelected?: boolean;
  disabled?: boolean;
  inline?: boolean;
};

export default function Button({
  children,
  isSelected = false,
  disabled = false,
  inline = false,
  className = "",
  onClick,
  ...props
}: ButtonProps) {
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

  const flexClass = inline ? "inline-flex max-w-fit mx-2" : "flex";

  return (
    <a
      className={`${flexClass} min-w-0 cursor-pointer flex-row items-center gap-2 rounded px-2 py-1 align-middle ${
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
