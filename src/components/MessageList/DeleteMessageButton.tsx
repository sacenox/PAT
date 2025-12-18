"use client";

import SecondaryButton from "@/src/components/buttons/SecondaryButton";
import TrashIcon from "@/src/components/icons/TrashIcon";

type DeleteMessageButtonProps = {
  messageId: number;
  threadId: number | null;
  onDeleteMessage: (messageId: number, threadId: number) => void;
  align?: "left" | "right";
};

export default function DeleteMessageButton({
  messageId,
  threadId,
  onDeleteMessage,
  align = "left",
}: DeleteMessageButtonProps) {
  if (threadId === null) {
    return null;
  }

  return (
    <div className={`mt-2 ${align === "right" ? "flex justify-end" : ""}`}>
      <div className="w-fit rounded-lg bg-neutral-300/80 px-3 py-1 dark:bg-neutral-800/80">
        <SecondaryButton
          onClick={(e) => {
            e.preventDefault();
            onDeleteMessage(messageId, threadId);
          }}
          className="cursor-pointer"
        >
          <TrashIcon className="h-3 w-3" />
          <span className="text-xs">Delete</span>
        </SecondaryButton>
      </div>
    </div>
  );
}
