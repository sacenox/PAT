"use client";

export default function NoThreadSelected() {
  return (
    <div className="mx-auto min-w-0 max-w-5xl">
      <div className="flex flex-col gap-4 bg-neutral-200 p-8 dark:bg-neutral-900">
        <h1 className="text-4xl font-bold">Hello, I&apos;m PAT 👋</h1>
        <p>
          <strong>PAT</strong> (Personal Assistant Thing) is your personal assistant. Start typing
          below to start new a conversation thread or pick a previous conversation thread from the
          sidebar.
        </p>
      </div>
    </div>
  );
}
