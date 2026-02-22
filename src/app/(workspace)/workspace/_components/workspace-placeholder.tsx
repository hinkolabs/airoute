import Link from "next/link";

interface WorkspacePlaceholderProps {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
}

export default function WorkspacePlaceholder({
  title,
  description,
  backHref,
  backLabel,
}: WorkspacePlaceholderProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Coming soon
      </p>
      <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
      {description && (
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <Link
        href={backHref}
        className="inline-flex items-center justify-center rounded-full border border-border px-6 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
      >
        {backLabel ?? "Back to workspace"}
      </Link>
    </div>
  );
}
