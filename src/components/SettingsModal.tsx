"use client";

import Modal from "@/src/components/Modal";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  themeMode: "device" | "dark" | "light";
  onThemeChange: (mode: "device" | "dark" | "light") => void;
};

export default function SettingsModal({
  isOpen,
  onClose,
  themeMode,
  onThemeChange,
}: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-semibold text-neutral-800 dark:text-neutral-200">
        Settings
      </h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-neutral-600 dark:text-neutral-400">Theme</label>
          <select
            value={themeMode}
            onChange={(e) => onThemeChange(e.target.value as "device" | "dark" | "light")}
            className="bg-white px-3 py-1 text-neutral-800 focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
          >
            <option value="device">Device</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
