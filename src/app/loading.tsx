import { Card } from "@/components/Card";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-16">
      <Card className="flex items-center gap-3 text-sm text-fg-dim">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        Loading profile…
      </Card>
    </main>
  );
}
