"use client";

import type { ReactNode } from "react";

type NotificationProps = {
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
};

export default function Notification({ icon, children, action }: NotificationProps) {
  return (
    <div className="pointer-events-auto mb-2 flex w-fit items-center gap-2 rounded-lg bg-neutral-300/80 px-3 py-1 dark:bg-neutral-800/80">
      {icon}
      {children}
      {action}
    </div>
  );
}
