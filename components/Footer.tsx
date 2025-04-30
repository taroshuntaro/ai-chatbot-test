"use client";

import { FC } from "react";
import Link from "next/link";

const FooterLink: FC<{ href: string; label: string }> = ({ href, label }) => (
  <Link
    href={href}
    className="text-blue-500 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
  >
    {label}
  </Link>
);

const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 transition-colors duration-200 border-t border-gray-200 dark:border-gray-700">
      <p className="mb-2">© {currentYear} AI Chatbot. All rights reserved.</p>
      <nav aria-label="フッターナビゲーション">
        <ul className="flex justify-center space-x-4 mt-2">
          <li>
            <FooterLink href="/terms" label="利用規約" />
          </li>
          <li>
            <FooterLink href="/privacy" label="プライバシーポリシー" />
          </li>
          <li>
            <FooterLink href="/contact" label="お問い合わせ" />
          </li>
        </ul>
      </nav>
    </footer>
  );
};

export default Footer;
