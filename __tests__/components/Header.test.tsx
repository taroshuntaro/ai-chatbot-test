import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";
import "@testing-library/jest-dom";

// useThemeフックをモック
jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: jest.fn(),
    mounted: true,
  }),
}));

describe("Header コンポーネント", () => {
  it("ヘッダーが正しくレンダリングされること", () => {
    render(<Header />);

    // タイトルリンクが存在するか確認
    const titleLink = screen.getByText("AI Chatbot");
    expect(titleLink).toBeInTheDocument();

    // リンクが正しいhref属性を持っているか確認
    expect(titleLink.closest("a")).toHaveAttribute("href", "/");

    // テーマトグルボタンが存在するか確認
    const themeToggleButton = screen.getByRole("button", {
      name: /ダークモードに切り替え|ライトモードに切り替え/i,
    });
    expect(themeToggleButton).toBeInTheDocument();
  });
});
