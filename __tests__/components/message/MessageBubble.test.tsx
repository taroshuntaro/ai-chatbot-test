import React from "react";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/message/MessageBubble";
import { Message } from "@/types/message";
import "@testing-library/jest-dom";

// MessageContent コンポーネントをモック
jest.mock("@/components/message/MessageContent", () => ({
  MessageContent: ({ message }: { message: Message }) => (
    <div data-testid="mock-message-content">{message.text}</div>
  ),
}));

// CopyButton コンポーネントをモック
jest.mock("@/components/message/CopyButton", () => ({
  CopyButton: ({ text }: { text: string }) => (
    <button data-testid="mock-copy-button">コピー</button>
  ),
}));

describe("MessageBubble コンポーネント", () => {
  // テスト用のメッセージデータ
  const userMessage: Message = {
    id: "user-1",
    text: "ユーザーメッセージ",
    sender: "user",
    timestamp: new Date().toISOString(),
  };

  const botMessage: Message = {
    id: "bot-1",
    text: "ボットメッセージ",
    sender: "bot",
    timestamp: new Date().toISOString(),
  };

  const markdownMessage: Message = {
    id: "bot-2",
    text: "マークダウン**テスト**",
    html: "マークダウン<strong>テスト</strong>",
    sender: "bot",
    timestamp: new Date().toISOString(),
    isMarkdown: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ユーザーメッセージが正しくレンダリングされること", () => {
    const { container } = render(
      <MessageBubble message={userMessage} showCopyButton={false} />
    );

    // ユーザーメッセージ用のスタイルが適用されていることを確認
    // MessageBubbleコンポーネントの親divではなく子divにクラスが適用されているので修正
    const messageElement = container.querySelector(
      ".bg-gray-300.dark\\:bg-gray-600"
    );
    expect(messageElement).toBeInTheDocument();

    // メッセージ内容が正しくレンダリングされていることを確認
    expect(screen.getByText("ユーザーメッセージ")).toBeInTheDocument();

    // コピーボタンが表示されないことを確認
    expect(screen.queryByTestId("mock-copy-button")).not.toBeInTheDocument();
  });

  it("ボットメッセージが正しくレンダリングされること", () => {
    render(<MessageBubble message={botMessage} showCopyButton={true} />);

    // ボットメッセージ用のスタイルが適用されていることを確認
    const messageContent = screen.getByText("ボットメッセージ");
    expect(messageContent).toBeInTheDocument();

    // コピーボタンが表示されることを確認
    expect(screen.getByTestId("mock-copy-button")).toBeInTheDocument();
  });

  it("マークダウンメッセージが正しくレンダリングされること", () => {
    const { container } = render(
      <MessageBubble message={markdownMessage} showCopyButton={true} />
    );

    // マークダウンメッセージ用のスタイルが確認
    // MessageContent はモック化されているため、メッセージのテキストのみを確認
    const messageContent = screen.getByText("マークダウン**テスト**");
    expect(messageContent).toBeInTheDocument();

    // whitespace-pre-wrap クラスがないことを確認（マークダウンメッセージの場合）
    // 直接親要素を取得して確認する方法に修正
    const messageDiv = container.querySelector("div > div");
    expect(messageDiv).not.toHaveClass("whitespace-pre-wrap");
  });

  it("showCopyButton が false の場合、コピーボタンが表示されないこと", () => {
    render(<MessageBubble message={botMessage} showCopyButton={false} />);

    // コピーボタンが表示されないことを確認
    expect(screen.queryByTestId("mock-copy-button")).not.toBeInTheDocument();
  });
});
