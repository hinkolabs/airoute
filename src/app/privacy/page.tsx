export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 pb-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-50">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-400">
            Last updated: December 2025
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Introduction</h2>
          <p className="text-slate-300">
            Airoute ("we", "our", or "us") operates the website airoute.ai. This page informs you of our policies regarding the collection, use, and disclosure of personal information we receive from users of the site.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Information We Collect</h2>
          <p className="text-slate-300">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Email addresses (if you subscribe to our newsletter)</li>
            <li>Usage data through Google Analytics</li>
            <li>Browser and device information</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">How We Use Information</h2>
          <p className="text-slate-300">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Provide and improve our services</li>
            <li>Understand how users interact with our site</li>
            <li>Send occasional updates (if you subscribed)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Cookies & Analytics</h2>
          <p className="text-slate-300">
            We use Google Analytics to understand site usage. Google Analytics uses cookies to collect anonymous usage data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Third-Party Services</h2>
          <p className="text-slate-300">
            We link to third-party AI tools. We are not responsible for the privacy practices of these external sites.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Contact Information</h2>
          <p className="text-slate-300">
            If you have questions about this Privacy Policy, contact us at:{" "}
            <a href="mailto:contact@hinkolabs.com" className="text-emerald-400 hover:underline">
              contact@hinkolabs.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}








