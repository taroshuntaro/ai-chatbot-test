/**
 * テーマ管理カスタムフック
 *
 * このフックは、アプリケーション全体のテーマ（ライト/ダークモード）の管理を行います。
 * 主な機能：
 * - テーマの切り替え
 * - ローカルストレージを使用した設定の永続化
 * - CSSクラスとdata属性を通じたスタイルの適用
 * - SSRとCSRの一貫性を保つためのマウント状態管理
 *
 * @module useTheme
 */
"use client";

import { useState, useEffect } from "react";

/**
 * テーマの型定義
 */
export type Theme = "light" | "dark";

/**
 * テーマ関連の定数
 */
const THEME_CONSTANTS = {
  /**
   * テーマのデフォルト値
   */
  DEFAULT: "light" as Theme,

  /**
   * ライトモード値
   */
  LIGHT: "light" as Theme,

  /**
   * ダークモード値
   */
  DARK: "dark" as Theme,

  /**
   * ローカルストレージのキー
   */
  STORAGE_KEY: "theme",
};

/**
 * テーマ管理フックの戻り値の型
 */
interface UseThemeReturn {
  /** 現在のテーマ */
  theme: Theme;
  /** テーマを切り替える関数 */
  toggleTheme: () => void;
  /** コンポーネントがマウントされたかどうか */
  mounted: boolean;
}

/**
 * テーマを適用する関数
 * HTMLドキュメントに適切なクラスとdata属性を設定
 *
 * @param theme 適用するテーマ
 */
function applyThemeToDocument(theme: Theme): void {
  // data-theme属性で現在のテーマを示す（CSS変数用）
  document.documentElement.setAttribute("data-theme", theme);

  // ダークモードの場合はdarkクラスを追加、そうでなければ削除
  if (theme === THEME_CONSTANTS.DARK) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

/**
 * ローカルストレージからテーマを読み込む関数
 *
 * @returns 保存されているテーマまたはデフォルト値
 */
function loadStoredTheme(): Theme {
  try {
    // クライアントサイドでのみ実行（ローカルストレージはブラウザのみ）
    if (typeof window === "undefined") {
      return THEME_CONSTANTS.DEFAULT;
    }

    const savedTheme = localStorage.getItem(
      THEME_CONSTANTS.STORAGE_KEY
    ) as Theme;
    return savedTheme || THEME_CONSTANTS.DEFAULT;
  } catch (error) {
    // ローカルストレージ操作でエラーが発生した場合
    console.error("テーマの読み込み中にエラーが発生しました:", error);
    return THEME_CONSTANTS.DEFAULT;
  }
}

/**
 * テーマを管理するカスタムフック
 *
 * @returns テーマ管理に関する状態と操作関数
 */
export function useTheme(): UseThemeReturn {
  // 現在のテーマ状態
  const [theme, setTheme] = useState<Theme>(THEME_CONSTANTS.DEFAULT);
  // コンポーネントのマウント状態（SSR対策）
  const [mounted, setMounted] = useState(false);

  // 初期化処理（マウント時に一度だけ実行）
  useEffect(() => {
    // マウントフラグを設定
    setMounted(true);

    // ローカルストレージからテーマを読み込み適用
    const savedTheme = loadStoredTheme();
    setTheme(savedTheme);
    applyThemeToDocument(savedTheme);
  }, []);

  /**
   * テーマを切り替える関数
   * 現在と反対のテーマに切り替え、保存と適用を行います
   */
  function toggleTheme() {
    try {
      // 現在のテーマと反対のテーマを設定
      const newTheme: Theme =
        theme === THEME_CONSTANTS.LIGHT
          ? THEME_CONSTANTS.DARK
          : THEME_CONSTANTS.LIGHT;

      // 状態を更新
      setTheme(newTheme);

      // DOMにテーマを適用
      applyThemeToDocument(newTheme);

      // テーマをローカルストレージに保存
      localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("テーマの切り替え中にエラーが発生しました:", error);
    }
  }

  return {
    theme,
    toggleTheme,
    mounted,
  };
}
