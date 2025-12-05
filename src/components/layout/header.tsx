import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <span className="text-xl font-bold text-white">Airoute</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link
            href="/simple"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Simple Mode
          </Link>
        </nav>
      </div>
    </header>
  );
}

