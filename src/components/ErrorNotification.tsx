"use client";

import ErrorIcon from "@/src/components/icons/ErrorIcon";
import Notification from "@/src/components/Notification";

type ErrorNotificationProps = {
  message: string;
};

export default function ErrorNotification({ message }: ErrorNotificationProps) {
  return (
    <Notification icon={<ErrorIcon className="h-4 w-4 text-red-600 dark:text-red-400" />}>
      <span className="text-xs text-neutral-600 dark:text-neutral-400">{message}</span>
    </Notification>
  );
}
