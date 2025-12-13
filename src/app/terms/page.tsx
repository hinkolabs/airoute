export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 pb-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-50">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-400">
            Last updated: December 2025
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Acceptance of Terms</h2>
          <p className="text-slate-300">
            By accessing and using Airoute, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Description of Service</h2>
          <p className="text-slate-300">
            Airoute is an informational AI tool navigation service. We provide curated recommendations and guides to help users discover AI tools. We do not sell, host, or directly provide the AI tools themselves.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">No Warranty Disclaimer</h2>
          <p className="text-slate-300">
            Airoute is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or usefulness of any information on the site.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Limitation of Liability</h2>
          <p className="text-slate-300">
            Users are responsible for decisions made using information from Airoute. We are not liable for any outcomes resulting from the use of AI tools discovered through our service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Changes to Terms</h2>
          <p className="text-slate-300">
            We reserve the right to modify these terms at any time. Continued use of the site after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">Contact Information</h2>
          <p className="text-slate-300">
            For questions about these Terms of Service, contact us at:{" "}
            <a href="mailto:contact@hinkolabs.com" className="text-emerald-400 hover:underline">
              contact@hinkolabs.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}


