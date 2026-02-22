import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <span className="text-xs font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Airoute</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} HinkoLabs
            </p>
            <div className="flex items-center gap-3 text-xs">
              <Link href="/privacy" className="text-muted-foreground font-medium transition-colors hover:text-primary">
                Privacy Policy
              </Link>
              <span className="text-muted-foreground/60">·</span>
              <Link href="/terms" className="text-muted-foreground font-medium transition-colors hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}







