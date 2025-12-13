import Link from "next/link";
import NormalModePage from "./_components/normal-mode-page";

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      {/* ============================================
          Minimal Header
          ============================================ */}
      <header className="sticky top-0 z-50 h-16 bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C16A]">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0A0F14]">
              Airoute
            </span>
          </Link>
        </div>
      </header>

      {/* ============================================
          Section A: The Hook (Hero)
          ============================================ */}
      <section className="px-6 py-16 text-center md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight text-[#0A0F14] md:text-4xl lg:text-5xl">
            What kind of work do you want to{' '}
            <span className="text-[#00C16A]">create</span>?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#4B5563] md:mt-6 md:text-lg">
            Choose your goal. We navigate you to the best AI workflow.
          </p>
        </div>
      </section>

      {/* ============================================
          Section B: Strategic Task Grid (Bento Layout)
          ============================================ */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {/* Desktop: Bento Grid / Mobile: Stack */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-3 md:gap-5">
          
          {/* Card 1: Image & Design (Hero Card - 가장 큼) */}
          <Link
            href="/tools?category=image"
            className="group flex flex-col justify-between rounded-2xl border-2 border-[#00C16A]/30 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#00C16A] hover:shadow-lg md:col-span-2 md:row-span-2 md:p-8"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#E0FDF4]">
              <Palette className="h-7 w-7 text-[#00C16A]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#0A0F14] md:text-3xl">
                Image & Design
              </h3>
              <p className="mt-2 text-base text-[#4B5563]">
                Logo, Character, Art, Photo Editing
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#00C16A]">
                Explore tools →
              </span>
            </div>
          </Link>

          {/* Card 2: Writing & Copy (Major Card - 세로로 긺) */}
          <Link
            href="/tools?category=writing"
            className="group flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#00C16A] hover:shadow-lg md:col-span-1 md:row-span-2"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E0FDF4]">
              <PenTool className="h-6 w-6 text-[#00C16A]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0A0F14]">
                Writing & Copy
              </h3>
              <p className="mt-2 text-sm text-[#4B5563]">
                Blog, Marketing, Translation
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#00C16A]">
                Explore →
              </span>
            </div>
          </Link>

          {/* Card 3: Video & Editing (Secondary) */}
          <Link
            href="/tools?category=video"
            className="group flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#00C16A] hover:shadow-lg md:col-span-1 md:row-span-1"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6]">
              <Video className="h-5 w-5 text-[#4B5563]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A0F14]">Video</h3>
              <p className="mt-1 text-sm text-[#4B5563]">Shorts, Edit</p>
            </div>
          </Link>

          {/* Card 4: Coding & Dev */}
          <Link
            href="/tools?category=coding"
            className="group flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#00C16A] hover:shadow-lg md:col-span-1 md:row-span-1"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6]">
              <Code className="h-5 w-5 text-[#4B5563]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A0F14]">Coding</h3>
              <p className="mt-1 text-sm text-[#4B5563]">Code, Debug</p>
            </div>
          </Link>

          {/* Card 5: Music & Audio */}
          <Link
            href="/tools?category=audio"
            className="group flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#00C16A] hover:shadow-lg md:col-span-1 md:row-span-1"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6]">
              <Music className="h-5 w-5 text-[#4B5563]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A0F14]">Audio</h3>
              <p className="mt-1 text-sm text-[#4B5563]">Music, Sound</p>
            </div>
          </Link>

          {/* Card 6: Voice & Speech */}
          <Link
            href="/tools?category=voice"
            className="group flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#00C16A] hover:shadow-lg md:col-span-1 md:row-span-1"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6]">
              <Mic className="h-5 w-5 text-[#4B5563]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A0F14]">Voice</h3>
              <p className="mt-1 text-sm text-[#4B5563]">TTS, Clone</p>
            </div>
          </Link>

        </div>
      </section>

      {/* ============================================
          Section C: Revenue Stream (Affiliate)
          ============================================ */}
      <section className="bg-[#F3F4F6] px-6 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="mb-6 flex items-center gap-2">
            <Flame className="h-5 w-5 text-[#00C16A]" />
            <h2 className="text-lg font-bold text-[#0A0F14] md:text-xl">
              Most Profitable Tools
            </h2>
          </div>

          {/* Horizontal Scroll */}
          <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0">
            {AFFILIATE_TOOLS.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-[200px] flex-col justify-between rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all hover:shadow-md md:min-w-0"
              >
                <div>
                  <h4 className="text-base font-bold text-[#0A0F14]">{tool.name}</h4>
                  <p className="mt-1 text-sm text-[#4B5563]">{tool.desc}</p>
                </div>
                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00C16A] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00A85D]">
                  Visit Website
                  <ExternalLink className="h-4 w-4" />
                </button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Footer
          ============================================ */}
      <footer className="px-6 py-8 text-center">
        <p className="text-sm text-[#4B5563]">
          © 2025 HinkoLabs · Airoute
        </p>
      </footer>
    </div>
  );
}
