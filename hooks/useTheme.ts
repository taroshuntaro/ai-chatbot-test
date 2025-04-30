"use client";

import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // クライアントサイドでのみ実行
    setMounted(true);

    // ローカルストレージからテーマを読み込む
    const savedTheme = (localStorage.getItem("theme") as Theme) || "light";
    setTheme(savedTheme);

    // HTMLのdata-theme属性とdarkクラスを設定
    applyTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    // テーマを適用
    applyTheme(newTheme);

    // テーマをローカルストレージに保存
    localStorage.setItem("theme", newTheme);
  };

  // クライアントサイドでのテーマ適用処理を分離
  const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return {
    theme,
    toggleTheme,
    mounted,
  };
}
