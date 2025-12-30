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
          <h2 className="text-xl font-semibold text-slate-50">1. Introduction</h2>
          <p className="text-slate-300">
            Airoute ("we", "our", or "us") is operated by HinkoLabs and operates the website{" "}
            <a href="https://airoute.ai" className="text-emerald-400 hover:underline">
              https://airoute.ai
            </a>{" "}
            (the "Service").
          </p>
          <p className="text-slate-300">
            This page informs you of our policies regarding the collection, use, and disclosure of personal information when you use our Service.
          </p>
          <p className="text-slate-300">
            By using the Service, you agree to the collection and use of information in accordance with this policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">2. Information We Collect</h2>
          
          <h3 className="text-lg font-semibold text-slate-100">A. Personal Data</h3>
          <p className="text-slate-300">
            We collect information that you provide directly to us, specifically when you sign in using Google OAuth or sign up via email:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
            <li><strong>Email Address:</strong> Used for account identification and communication.</li>
            <li><strong>Name / Profile Information:</strong> Used to display your user profile within the Service.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-100 mt-4">B. Usage Data</h3>
          <p className="text-slate-300">
            We may collect information automatically when you use the Service, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Pages visited and time spent</li>
            <li>Device information</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">3. How We Use Google User Data (Important)</h2>
          <p className="text-slate-300">
            Our Service uses Google OAuth for authentication.
          </p>
          <p className="text-slate-300">
            If you choose to sign in with Google:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
            <li>We only access your Google email address, name, and profile picture.</li>
            <li><strong>Purpose:</strong> Solely for account creation, authentication, and profile display.</li>
            <li><strong>Limited Use:</strong> We do not sell, rent, or share Google user data with third parties or use it for advertising or surveillance.</li>
          </ul>
          <p className="text-slate-300 mt-4">
            <strong>Airoute's use of information received from Google APIs complies with the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              Google API Services User Data Policy
            </a>, including the Limited Use requirements.</strong>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">4. How We Use Information</h2>
          <p className="text-slate-300">
            We use collected information to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
            <li>Operate and maintain the Service.</li>
            <li>Improve user experience and analyze usage (via Google Analytics).</li>
            <li>Send essential service-related communications (e.g., security updates).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">5. Cookies & Analytics</h2>
          <p className="text-slate-300">
            We use Google Analytics to understand how users interact with our site.
            Google Analytics uses cookies to collect anonymized traffic data. You can disable cookies through your browser settings.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">6. Data Retention & Deletion</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4">
            <li><strong>Retention:</strong> We retain personal data only as long as necessary to provide the Service.</li>
            <li>
              <strong>Deletion:</strong> You may request deletion of your account and associated data by contacting{" "}
              <a href="mailto:contact@hinkolabs.com" className="text-emerald-400 hover:underline">
                contact@hinkolabs.com
              </a>. Requests are processed within 30 days.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">7. Third-Party Services</h2>
          <p className="text-slate-300">
            Our Service may link to external AI tools or websites. We are not responsible for the content or privacy practices of third-party services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">8. International Data Transfers</h2>
          <p className="text-slate-300">
            Your information may be stored and processed on servers located outside your country of residence.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">9. Children's Information</h2>
          <p className="text-slate-300">
            The Service is not intended for individuals under the age of 13.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">10. Security</h2>
          <p className="text-slate-300">
            We use commercially reasonable measures (including Supabase security practices) to protect your personal information, but no system is 100% secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-50">11. Contact Us</h2>
          <p className="text-slate-300">
            If you have any questions about this Privacy Policy:
          </p>
          <ul className="list-none space-y-2 text-slate-300 pl-4">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:contact@hinkolabs.com" className="text-emerald-400 hover:underline">
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











