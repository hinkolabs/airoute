import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/layout/header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { ThemeProvider } from "@/app/_design/providers/theme-provider";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-background text-primary`}>
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

        <ThemeProvider>
          {/* 🔥 전역 헤더 - Dark Mode */}
          <Header />
          
          {/* 본문 (헤더 높이만큼 패딩 추가) */}
          <main className="pb-20 md:pb-0">
            {children}
          </main>
          
          {/* 🔥 전역 하단 메뉴 - 모바일 전용 */}
          <MobileBottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
