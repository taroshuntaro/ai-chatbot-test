"use client";

import { FC } from "react";
import Link from "next/link";
import ThemeToggleButton from "./ThemeToggleButton";

const Header: FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 p-4 bg-gray-100 dark:bg-gray-800 text-black dark:text-white flex justify-between items-center transition-colors duration-200 z-10 shadow-md">
      <Link
        href="/"
        className="text-lg font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        AI Chatbot
      </Link>
      <ThemeToggleButton />
    </header>
  );
};

export default Header;
