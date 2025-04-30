import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// フォント設定
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // フォント読み込み中の表示を最適化
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// メタデータ設定
export const metadata: Metadata = {
  title: "AI Chatbot Application",
  description:
    "An intelligent chatbot application to assist with your queries.",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white font-sans transition-colors duration-200">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow px-4 sm:px-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
