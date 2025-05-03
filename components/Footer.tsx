/**
 * フッターコンポーネント
 *
 * アプリケーションのフッター部分を表示するコンポーネントです。
 * 著作権表示と各種リンク（利用規約、プライバシーポリシー、お問い合わせ）を含みます。
 *
 * @module Footer
 */
"use client";

import { FC } from "react";
import Link from "next/link";

/**
 * フッターリンクの型定義
 */
interface FooterLinkProps {
  /** リンク先のURL */
  href: string;
  /** リンクのラベルテキスト */
  label: string;
}

/**
 * フッターナビゲーションのリンク情報
 */
const FOOTER_LINKS: FooterLinkProps[] = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/contact", label: "お問い合わせ" },
];

/**
 * フッターリンクコンポーネント
 * 一貫したスタイルのリンクを表示します
 *
 * @param href リンク先のURL
 * @param label リンクのラベルテキスト
 */
const FooterLink: FC<FooterLinkProps> = ({ href, label }) => (
  <Link
    href={href}
    className="text-blue-500 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
    aria-label={`${label}ページへ移動`}
  >
    {label}
  </Link>
);

/**
 * フッターコンポーネント
 * アプリケーションのフッター部分を表示します
 */
const Footer: FC = () => {
  // 現在の年を取得（著作権表示用）
  const currentYear = new Date().getFullYear();

  return (
    <footer className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 transition-colors duration-200 border-t border-gray-200 dark:border-gray-700">
      <p className="mb-2">© {currentYear} AI Chatbot. All rights reserved.</p>
      <nav aria-label="フッターナビゲーション">
        <ul className="flex justify-center space-x-4 mt-2">
          {FOOTER_LINKS.map((link) => (
            <li key={link.href}>
              <FooterLink href={link.href} label={link.label} />
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
};

export default Footer;
