"use client";

import SecondaryButton from "@/src/components/buttons/SecondaryButton";
import StopIcon from "@/src/components/icons/StopIcon";

type ThinkingNotificationProps = {
  onStop: () => void;
};

export default function ThinkingNotification({ onStop }: ThinkingNotificationProps) {
  return (
    <div className="pointer-events-auto mb-2 flex w-fit items-center gap-2 rounded-lg bg-neutral-300/80 px-3 py-1 dark:bg-neutral-800/80">
      <span className="text-xs text-neutral-600 dark:text-neutral-400">
        <span className="animate-color-cycle">thinking</span>
      </span>
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
    </div>
  );
}
