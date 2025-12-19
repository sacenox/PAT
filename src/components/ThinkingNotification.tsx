"use client";

import SecondaryButton from "@/src/components/buttons/SecondaryButton";
import StopIcon from "@/src/components/icons/StopIcon";
import Notification from "@/src/components/Notification";

type ThinkingNotificationProps = {
  onStop: () => void;
};

export default function ThinkingNotification({ onStop }: ThinkingNotificationProps) {
  return (
    <Notification
      action={
        <SecondaryButton
          href="#"
          className="text-xs"
          onClick={(e) => {
            e.preventDefault();
            onStop();
          }}
        >
          <StopIcon className="h-4 w-4" />
          Stop
        </SecondaryButton>
      }
    >
      <span className="text-xs text-neutral-600 dark:text-neutral-400">
        <span className="animate-color-cycle">thinking</span>
      </span>
    </Notification>
  );
}
