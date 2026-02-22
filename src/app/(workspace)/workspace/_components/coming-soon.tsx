import Link from "next/link";

export default function WorkspaceComingSoon() {
  return (
    <div className="flex h-screen items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-lg">
        <div className="mb-4 text-4xl">🚀</div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Workspace is coming soon
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          We&apos;re currently operating KR Workspace first. Global Workspace will open later.
        </p>
        <Link
          href="/kr/workspace"
          className="inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Go to KR Workspace
        </Link>
      </div>
    </div>
  );
}
