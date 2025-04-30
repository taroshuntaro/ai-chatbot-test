"use client";

import { FC } from "react";
import { useTheme } from "@/hooks/useTheme";

const ThemeToggleButton: FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  // マウント前は何も表示しない（SSRとCSRの不一致を防ぐため）
  if (!mounted) {
    return <div className="w-12 h-6"></div>; // プレースホルダー
  }

  return (
    <div className="flex items-center">
      <span className="mr-2 text-black dark:text-white" aria-hidden="true">
        ☀️
      </span>
      <button
        onClick={toggleTheme}
        className={`
          relative inline-flex items-center h-6 rounded-full w-12 transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${theme === "dark" ? "bg-blue-600" : "bg-gray-200"}
        `}
        aria-pressed={theme === "dark"}
        aria-label={
          theme === "light"
            ? "ダークモードに切り替え"
            : "ライトモードに切り替え"
        }
      >
        <span className="sr-only">
          {theme === "light"
            ? "ダークモードに切り替え"
            : "ライトモードに切り替え"}
        </span>
        <span
          className={`
            inline-block w-4 h-4 transform bg-white rounded-full 
            transition-transform duration-200 ease-in-out
            ${theme === "dark" ? "translate-x-7" : "translate-x-1"}
          `}
        />
      </button>
      <span className="ml-2 text-black dark:text-white" aria-hidden="true">
        🌙
      </span>
    </div>
  );
};

export default ThemeToggleButton;
