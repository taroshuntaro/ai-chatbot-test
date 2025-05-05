import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CopyButton } from "@/components/message/CopyButton";
import "@testing-library/jest-dom";

// グローバルに navigator.clipboard.writeText をモック
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

// setTimeoutをモック
jest.useFakeTimers();

describe("CopyButton コンポーネント", () => {
  const testText = "コピーするテキスト";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("初期状態ではコピーアイコンが表示されること", () => {
    render(<CopyButton text={testText} />);

    // ボタンが表示されることを確認
    const button = screen.getByRole("button", { name: "メッセージをコピー" });
    expect(button).toBeInTheDocument();

    // 初期状態ではチェックマークが表示されないことを確認（SVGの確認方法を修正）
    const svgElements = document.querySelectorAll("svg");
    // 最初のSVGはコピーアイコンであることを確認
    expect(svgElements.length).toBeGreaterThan(0);
    const successIcon = document.querySelector(".text-green-500");
    expect(successIcon).not.toBeInTheDocument();
  });

  it("ボタンをクリックするとテキストがクリップボードにコピーされること", async () => {
    render(<CopyButton text={testText} />);

    // ボタンをクリック
    await act(async () => {
      const button = screen.getByRole("button", { name: "メッセージをコピー" });
      fireEvent.click(button);
    });

    // クリップボードにテキストがコピーされることを確認
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
  });

  it("コピー成功後にチェックマークアイコンが表示され、一定時間後に元に戻ること", async () => {
    render(<CopyButton text={testText} />);

    // ボタンをクリック
    await act(async () => {
      const button = screen.getByRole("button", { name: "メッセージをコピー" });
      fireEvent.click(button);
    });

    // 成功アイコンが表示されることを確認
    const successIcon = document.querySelector(".text-green-500");
    expect(successIcon).toBeInTheDocument();

    // タイマーを進める
    await act(async () => {
      jest.advanceTimersByTime(2000); // COPY_FEEDBACK_DURATION_MS の値と同じ
    });

    // 2秒後にチェックマークが消えることを確認
    const successIconAfterTimeout = document.querySelector(".text-green-500");
    expect(successIconAfterTimeout).not.toBeInTheDocument();
  });

  it("コピーに失敗した場合もエラーハンドリングされること", async () => {
    // テスト用にクリップボードAPIをエラーを投げるようにモック
    navigator.clipboard.writeText = jest
      .fn()
      .mockRejectedValue(new Error("コピー失敗"));

    // コンソールエラーをモック
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<CopyButton text={testText} />);

    // ボタンをクリック
    await act(async () => {
      const button = screen.getByRole("button", { name: "メッセージをコピー" });
      fireEvent.click(button);
    });

    // コンソールエラーが呼ばれることを確認
    expect(consoleSpy).toHaveBeenCalledWith(
      "コピーに失敗しました",
      expect.any(Error)
    );

    // タイマーを進める
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // エラーが発生してもコンポーネントがクラッシュしないことを確認
    const button = screen.getByRole("button", { name: "メッセージをコピー" });
    expect(button).toBeInTheDocument();

    // モックを元に戻す
    navigator.clipboard.writeText = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    consoleSpy.mockRestore();
  });
});
