"use client";

import { forwardRef } from "react";

type SwitchProps = {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { checked, onChange, disabled = false, id, name, className = "", "aria-label": ariaLabel },
  ref
) {
  return (
    <label
      className={`relative inline-flex h-6 w-11 cursor-pointer items-center ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`}
      htmlFor={id}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        id={id}
        name={name}
        ref={ref}
        aria-label={ariaLabel}
      />
      <div
        className="h-6 w-11 rounded-full bg-neutral-300 transition-colors duration-200 peer-checked:bg-neutral-600
          dark:bg-neutral-700 dark:peer-checked:bg-neutral-500"
      />
      <div
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow
          transition-all duration-200 peer-checked:translate-x-5
          dark:bg-neutral-900"
      />
    </label>
  );
});
