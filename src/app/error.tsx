"use client";

import { Card } from "@/components/Card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-16">
      <Card className="max-w-md text-center">
        <p className="font-semibold text-fg">Couldn&apos;t reach the profile API</p>
        <p className="mt-1 text-sm text-fg-dim">{error.message}</p>
        <button
          onClick={reset}
          className="mt-5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </Card>
    </main>
  );
}
