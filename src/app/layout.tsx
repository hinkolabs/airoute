// AIROUTE 루트 레이아웃
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "./_design/components/app-shell";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AIROUTE – Find the best AI route",
  description: "Too many AI tools? AIROUTE finds the best route for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
