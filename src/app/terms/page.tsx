export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: December 2025
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing and using Airoute (
            <a href="https://airoute.ai" className="text-primary hover:underline">
              https://airoute.ai
            </a>
            ), operated by HinkoLabs ("we", "our", "us"), you agree to be bound by these Terms. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
          <p className="text-muted-foreground">
            Airoute is an informational AI tool navigation platform that provides curated guides, recommendations, and links to third-party AI tools.
          </p>
          <p className="text-muted-foreground">
            <strong>Disclaimer:</strong> Airoute does not sell, host, or directly provide AI software tools. We act solely as a discovery and navigation service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
            <li>Certain features may require signing in via Google OAuth.</li>
            <li>You are responsible for maintaining the confidentiality of your account.</li>
            <li>You agree to provide accurate and current information.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">4. Intellectual Property</h2>
          <p className="text-muted-foreground">
            All original content on the Service (excluding third-party tool names, logos, and trademarks) is the property of HinkoLabs.
            You may not reproduce, distribute, or exploit our content without prior written permission.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">5. Third-Party Links</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
            <li>The Service contains links to third-party websites and AI tools not controlled by Airoute.</li>
            <li>We assume no responsibility for third-party content or practices.</li>
            <li>Your use of third-party services is at your own risk.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">6. User Conduct</h2>
          <p className="text-muted-foreground">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
            <li>Misuse the Service</li>
            <li>Attempt unauthorized scraping, reverse engineering, or automated access</li>
            <li>Interfere with the Service's operation or security</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">7. No Warranty</h2>
          <p className="text-muted-foreground">
            The Service is provided "AS IS" and "AS AVAILABLE".
            We make no warranties regarding accuracy, reliability, or availability.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            HinkoLabs shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">9. Termination</h2>
          <p className="text-muted-foreground">
            We may suspend or terminate access to the Service at our discretion, without prior notice, for violations of these Terms or misuse of the Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">10. Indemnification</h2>
          <p className="text-muted-foreground">
            You agree to indemnify and hold harmless HinkoLabs from claims, damages, or expenses arising from your misuse of the Service or violation of these Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">11. Children</h2>
          <p className="text-muted-foreground">
            The Service is not intended for individuals under the age of 13.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">12. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">13. Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the Republic of Korea.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">14. Contact</h2>
          <p className="text-muted-foreground">
            For questions regarding these Terms:
          </p>
          <ul className="list-none space-y-2 text-muted-foreground pl-4">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:contact@hinkolabs.com" className="text-primary hover:underline">
                contact@hinkolabs.com
              </a>
            </li>
            <li><strong>Company:</strong> HinkoLabs</li>
          </ul>
        </section>
      </div>
    </div>
  );
}











