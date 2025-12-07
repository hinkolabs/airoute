export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span className="text-sm font-semibold text-zinc-400">Airoute</span>
          </div>
          
          <p className="text-sm text-zinc-500">
            © {currentYear} HinkoLabs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}







