"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  color?: string;
};

// PrimaryButton: A button with animated border effects and customizable color.
// Features a bottom border that moves to top on active state, with rounded corners.
// Color prop allows customization of the button's color scheme.
export default function PrimaryButton({
  children,
  color = "rose",
  className = "",
  ...props
}: PrimaryButtonProps) {
  // Map color to Tailwind classes (using full class names for JIT compilation)
  const getColorClasses = (colorName: string) => {
    const colorMap: Record<string, string> = {
      green: "text-green-100 bg-green-800 hover:bg-green-900 border-t-green-950 border-b-green-950",

      rose: "text-rose-100 bg-rose-800 hover:bg-rose-900 border-t-rose-950 border-b-rose-950",
      red: "text-red-100 bg-red-800 hover:bg-red-900 border-t-red-950 border-b-red-950",
      orange:
        "text-orange-100 bg-orange-800 hover:bg-orange-900 border-t-orange-950 border-b-orange-950",
      amber: "text-amber-100 bg-amber-800 hover:bg-amber-900 border-t-amber-950 border-b-amber-950",
      yellow:
        "text-yellow-100 bg-yellow-800 hover:bg-yellow-900 border-t-yellow-950 border-b-yellow-950",
      lime: "text-lime-100 bg-lime-800 hover:bg-lime-900 border-t-lime-950 border-b-lime-950",
      emerald:
        "text-emerald-100 bg-emerald-800 hover:bg-emerald-900 border-t-emerald-950 border-b-emerald-950",
      teal: "text-teal-100 bg-teal-800 hover:bg-teal-900 border-t-teal-950 border-b-teal-950",
      cyan: "text-cyan-100 bg-cyan-800 hover:bg-cyan-900 border-t-cyan-950 border-b-cyan-950",
      sky: "text-sky-100 bg-sky-800 hover:bg-sky-900 border-t-sky-950 border-b-sky-950",
      blue: "text-blue-100 bg-blue-800 hover:bg-blue-900 border-t-blue-950 border-b-blue-950",
      indigo:
        "text-indigo-100 bg-indigo-800 hover:bg-indigo-900 border-t-indigo-950 border-b-indigo-950",
      violet:
        "text-violet-100 bg-violet-800 hover:bg-violet-900 border-t-violet-950 border-b-violet-950",
      purple:
        "text-purple-100 bg-purple-800 hover:bg-purple-900 border-t-purple-950 border-b-purple-950",
      fuchsia:
        "text-fuchsia-100 bg-fuchsia-800 hover:bg-fuchsia-900 border-t-fuchsia-950 border-b-fuchsia-950",
      pink: "text-pink-100 bg-pink-800 hover:bg-pink-900 border-t-pink-950 border-b-pink-950",
      slate: "text-slate-100 bg-slate-800 hover:bg-slate-900 border-t-slate-950 border-b-slate-950",
      gray: "text-gray-100 bg-gray-800 hover:bg-gray-900 border-t-gray-950 border-b-gray-950",
      zinc: "text-zinc-100 bg-zinc-800 hover:bg-zinc-900 border-t-zinc-950 border-b-zinc-950",
      neutral:
        "text-neutral-100 bg-neutral-800 hover:bg-neutral-900 border-t-neutral-950 border-b-neutral-950",
      stone: "text-stone-100 bg-stone-800 hover:bg-stone-900 border-t-stone-950 border-b-stone-950",
    };
    return colorMap[colorName] || colorMap.rose;
  };

  return (
    <button
      className={`${getColorClasses(color)} flex cursor-pointer items-center justify-center gap-1 rounded-b-xl rounded-t-lg border-b-8 p-2 font-bold shadow-sm shadow-stone-800 active:rounded-t-xl active:border-b-0 active:border-t-8 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
