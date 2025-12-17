"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  isSelected?: boolean;
  color?: string;
};

// Anchor: A reusable anchor component with customizable selection highlight color.
// When selected (isSelected=true), displays a colored border based on the color prop.
// When not selected, uses neutral borders with hover effects.
export default function Anchor({
  children,
  isSelected = false,
  color = "green",
  className = "",
  ...props
}: AnchorProps) {
  // Map color to Tailwind border classes (using full class names for JIT compilation)
  const getBorderColorClasses = (colorName: string) => {
    const colorMap: Record<string, string> = {
      green: "border-green-900 dark:border-green-500",
      rose: "border-rose-900 dark:border-rose-500",
      red: "border-red-900 dark:border-red-500",
      orange: "border-orange-900 dark:border-orange-500",
      amber: "border-amber-900 dark:border-amber-500",
      yellow: "border-yellow-900 dark:border-yellow-500",
      lime: "border-lime-900 dark:border-lime-500",
      emerald: "border-emerald-900 dark:border-emerald-500",
      teal: "border-teal-900 dark:border-teal-500",
      cyan: "border-cyan-900 dark:border-cyan-500",
      sky: "border-sky-900 dark:border-sky-500",
      blue: "border-blue-900 dark:border-blue-500",
      indigo: "border-indigo-900 dark:border-indigo-500",
      violet: "border-violet-900 dark:border-violet-500",
      purple: "border-purple-900 dark:border-purple-500",
      fuchsia: "border-fuchsia-900 dark:border-fuchsia-500",
      pink: "border-pink-900 dark:border-pink-500",
      slate: "border-slate-900 dark:border-slate-500",
      gray: "border-gray-900 dark:border-gray-500",
      zinc: "border-zinc-900 dark:border-zinc-500",
      neutral: "border-neutral-900 dark:border-neutral-500",
      stone: "border-stone-900 dark:border-stone-500",
    };
    return colorMap[colorName] || colorMap.green;
  };

  return (
    <a
      className={`m-1 line-clamp-1 break-words border-b-2 p-1 italic ${
        isSelected
          ? getBorderColorClasses(color)
          : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-700"
      } ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}

