import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/layout/header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import GaPageView from "@/app/_components/ga-pageview";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Airoute - Confused by AI tools? Start here.",
  description: "Too many AI tools? Airoute finds the best route for you. Choose your goal, and we navigate you to the best AI workflow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Analytics */}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    send_page_view: false
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${inter.className} antialiased bg-background text-primary`}>
        {/* Google Analytics Page View Tracking */}
        {gaId && <GaPageView />}
        
        {/* 🔥 전역 헤더 - Dark Mode */}
        <Header />
        
        {/* 본문 (헤더 높이만큼 패딩 추가) */}
        <main className="pb-20 md:pb-0">
          {children}
        </main>
        
        {/* 🔥 전역 하단 메뉴 - 모바일 전용 */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
