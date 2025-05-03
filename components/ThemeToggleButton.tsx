/**
 * テーマ切り替えボタンコンポーネント
 *
 * ライトモードとダークモード間の切り替えを行うトグルボタンを提供します。
 * アクセシビリティにも配慮し、適切なaria属性とキーボード操作に対応しています。
 *
 * @module ThemeToggleButton
 */
"use client";

import { FC } from "react";
import { useTheme } from "@/hooks/useTheme";

/**
 * テーマ関連の定数
 */
const THEME = {
  /**
   * ライトモード
   */
  LIGHT: "light",

  /**
   * ダークモード
   */
  DARK: "dark",
};

/**
 * アクセシビリティラベル
 */
const ARIA_LABELS = {
  /**
   * ダークモードへ切り替えるときのラベル
   */
  TO_DARK: "ダークモードに切り替え",

  /**
   * ライトモードへ切り替えるときのラベル
   */
  TO_LIGHT: "ライトモードに切り替え",
};

/**
 * テーマ切り替えボタンコンポーネント
 * ライトモードとダークモードを切り替えるトグルスイッチを表示します
 */
const ThemeToggleButton: FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  // マウント前は何も表示しない（SSRとCSRの不一致を防ぐため）
  if (!mounted) {
    return (
      <div
        className="w-12 h-6"
        data-testid="theme-toggle-placeholder"
        aria-hidden="true"
      ></div>
    ); // プレースホルダー
  }

  // 現在のテーマに基づいてアクセシビリティラベルを決定
  const ariaLabel =
    theme === THEME.LIGHT ? ARIA_LABELS.TO_DARK : ARIA_LABELS.TO_LIGHT;

  // ダークモード状態に基づいてスタイルを決定
  const isDarkMode = theme === THEME.DARK;

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
          ${isDarkMode ? "bg-blue-600" : "bg-gray-200"}
        `}
        aria-pressed={isDarkMode}
        aria-label={ariaLabel}
      >
        <span className="sr-only">{ariaLabel}</span>
        <span
          className={`
            inline-block w-4 h-4 transform bg-white rounded-full 
            transition-transform duration-200 ease-in-out
            ${isDarkMode ? "translate-x-7" : "translate-x-1"}
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
