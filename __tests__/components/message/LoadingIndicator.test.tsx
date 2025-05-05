import React from "react";
import { render, screen } from "@testing-library/react";
import { LoadingIndicator } from "@/components/message/LoadingIndicator";
import "@testing-library/jest-dom";

describe("LoadingIndicator コンポーネント", () => {
  it("3つのドットがレンダリングされること", () => {
    render(<LoadingIndicator />);

    // 3つのドットがレンダリングされることを確認
    const dots = document.querySelectorAll(".animate-bounce");
    expect(dots).toHaveLength(3);
  });

  it("各ドットに適切なアニメーション遅延が設定されていること", () => {
    render(<LoadingIndicator />);

    // 3つのドットを取得
    const dots = document.querySelectorAll(".animate-bounce");

    // 各ドットのアニメーション遅延を確認
    expect(dots[0]).toHaveStyle("animation-delay: 0ms");
    expect(dots[1]).toHaveStyle("animation-delay: 150ms");
    expect(dots[2]).toHaveStyle("animation-delay: 300ms");
  });

  it("ダークモード対応のためのクラスが設定されていること", () => {
    render(<LoadingIndicator />);

    // ダークモード対応のクラスが設定されていることを確認
    const dots = document.querySelectorAll(".bg-gray-800.dark\\:bg-gray-200");
    expect(dots).toHaveLength(3);
  });
});
