"use client";

import ErrorIcon from "@/src/components/icons/ErrorIcon";

type ErrorNotificationProps = {
  message: string;
};

export default function ErrorNotification({ message }: ErrorNotificationProps) {
  return (
    <div className="pointer-events-auto mb-2 flex w-fit items-center gap-2 rounded-lg bg-neutral-300/80 px-3 py-1 dark:bg-neutral-800/80">
      <ErrorIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
      <span className="text-xs text-neutral-600 dark:text-neutral-400">{message}</span>
    </div>
  );
}
