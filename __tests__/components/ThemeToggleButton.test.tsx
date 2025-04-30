import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { useTheme } from "@/hooks/useTheme";

// useThemeフックをモック
jest.mock("@/hooks/useTheme");

describe("ThemeToggleButton コンポーネント", () => {
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("マウントされていない場合は、プレースホルダーが表示されること", () => {
    // モックの戻り値を設定
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      toggleTheme: mockToggleTheme,
      mounted: false,
    });

    render(<ThemeToggleButton />);

    // プレースホルダーが表示されることを確認
    const placeholder = screen.getByTestId("theme-toggle-placeholder");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveClass("w-12 h-6");
  });

  it("ライトモード時にボタンが正しくレンダリングされること", () => {
    // モックの戻り値を設定
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      toggleTheme: mockToggleTheme,
      mounted: true,
    });

    render(<ThemeToggleButton />);

    // ボタンが存在するか確認
    const button = screen.getByRole("button", {
      name: /ダークモードに切り替え/i,
    });
    expect(button).toBeInTheDocument();

    // ライトモード用のスタイルが適用されていることを確認
    expect(button).toHaveClass("bg-gray-200");
    expect(button).not.toHaveClass("bg-blue-600");

    // トグルのポジションが正しいことを確認
    const toggle = button.querySelector("span:not(.sr-only)");
    expect(toggle).toHaveClass("translate-x-1");
    expect(toggle).not.toHaveClass("translate-x-7");
  });

  it("ダークモード時にボタンが正しくレンダリングされること", () => {
    // モックの戻り値を設定
    (useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      toggleTheme: mockToggleTheme,
      mounted: true,
    });

    render(<ThemeToggleButton />);

    // ボタンが存在するか確認
    const button = screen.getByRole("button", {
      name: /ライトモードに切り替え/i,
    });
    expect(button).toBeInTheDocument();

    // ダークモード用のスタイルが適用されていることを確認
    expect(button).toHaveClass("bg-blue-600");
    expect(button).not.toHaveClass("bg-gray-200");

    // トグルのポジションが正しいことを確認
    const toggle = button.querySelector("span:not(.sr-only)");
    expect(toggle).toHaveClass("translate-x-7");
    expect(toggle).not.toHaveClass("translate-x-1");
  });

  it("ボタンをクリックするとtoggleTheme関数が呼ばれること", () => {
    // モックの戻り値を設定
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      toggleTheme: mockToggleTheme,
      mounted: true,
    });

    render(<ThemeToggleButton />);

    // ボタンをクリック
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // toggleTheme関数が呼ばれたことを確認
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});
