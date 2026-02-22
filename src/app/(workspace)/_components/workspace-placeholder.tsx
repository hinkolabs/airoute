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
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
      <Link
        href={backHref}
        className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        {backLabel ?? "Go back to Workspace"}
      </Link>
    </div>
  );
}
