"use client";

import SettingsForm from "@/src/components/SettingsForm";

export default function Welcome() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="m-8 flex flex-col gap-4 rounded-lg bg-neutral-200 p-8 dark:bg-neutral-800">
        <h1 className="text-4xl font-bold">Hello, I&apos;m PAT 👋</h1>
        <p>
          <strong>PAT</strong> (Personal Assistant Thing) is your personal assistant. Start typing
          below to start new a conversation thread or pick a previous conversation thread from the
          sidebar.
        </p>

        <hr className="my-4 border-neutral-300 dark:border-neutral-700" />

        <SettingsForm />
      </div>
    </div>
  );
}
