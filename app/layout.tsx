import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { ReactNode } from "react";
import AppLayout from "@/components/AppLayout";

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
  icons: {
    icon: "/favicon.ico",
  },
};

// viewportの設定を別途エクスポート
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

interface RootLayoutProps {
  children: ReactNode;
}

/**
 * アプリケーションのルートレイアウトコンポーネント
 * サーバーコンポーネントとして動作し、フォント設定やメタデータを提供
 * 状態管理を含む部分はクライアントコンポーネントのAppLayoutに委譲
 *
 * @param children レイアウト内に表示する子コンポーネント
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white font-sans transition-colors duration-200">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
