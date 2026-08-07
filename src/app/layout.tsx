import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { ThemeProvider } from "@/app/_design/providers/theme-provider";
import { AuthProvider } from "@/app/_providers/auth-provider";
import { DemoModeProvider } from "@/app/_providers/demo-mode-provider";
import { getDemoMode } from "@/lib/flags";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://www.airoute.ai"),
  title: "Airoute - Confused by AI tools? Start here.",
  description: "Too many AI tools? Airoute finds the best route for you. Choose your goal, and we navigate you to the best AI workflow.",
  openGraph: {
    title: "Airoute - Confused by AI tools? Start here.",
    description: "Too many AI tools? Airoute finds the best route for you. Choose your goal, and we navigate you to the best AI workflow.",
    url: "https://www.airoute.ai",
    siteName: "Airoute",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Airoute - Confused by AI tools? Start here.",
    description: "Too many AI tools? Airoute finds the best route for you. Choose your goal, and we navigate you to the best AI workflow.",
  },
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    }),
    other: {
      'impact-site-verification': '55bfca1d-814a-424a-bcf8-f8411c1cad71',
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const demoMode = await getDemoMode();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3036758334282217"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />

        {/* Google Analytics */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        <AuthProvider>
          <DemoModeProvider enabled={demoMode}>
            <ThemeProvider>
              <main className="pb-20 md:pb-0">
                {children}
              </main>
              <MobileBottomNav />
            </ThemeProvider>
          </DemoModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
