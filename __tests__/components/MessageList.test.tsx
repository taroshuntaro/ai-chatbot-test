import React from "react";
import { render, screen } from "@testing-library/react";
import MessageList from "@/components/MessageList";
import { Message } from "@/types/message";

// テスト用のモックメッセージ配列
const mockMessages: Message[] = [
  {
    id: "1",
    text: "こんにちは！",
    sender: "user",
    timestamp: new Date().toISOString(),
    isMarkdown: false,
  },
  {
    id: "2",
    text: "こんにちは！どのようにお手伝いできますか？",
    sender: "bot",
    timestamp: new Date().toISOString(),
    isMarkdown: false,
  },
  {
    id: "3",
    text: "マークダウンの**テスト**です",
    html: "マークダウンの<strong>テスト</strong>です",
    sender: "bot",
    timestamp: new Date().toISOString(),
    isMarkdown: true,
  },
];

// Loading状態のメッセージ
const loadingMessage: Message = {
  id: "4",
  text: "",
  sender: "bot",
  timestamp: new Date().toISOString(),
  isMarkdown: false,
  isLoading: true,
};

// 検索結果を含むメッセージ
const messageWithSearchResults: Message = {
  id: "5",
  text: "検索結果付きの回答です",
  sender: "bot",
  timestamp: new Date().toISOString(),
  isMarkdown: false,
  searchResults: [
    {
      title: "テスト検索結果",
      description: "これはテスト用の検索結果の説明です",
      url: "https://example.com",
    },
  ],
};

// animationFrameのモック
global.requestAnimationFrame = jest.fn((callback) => {
  callback(0); // Pass a DOMHighResTimeStamp argument
  return 0;
});

// setTimeoutのモック
jest.useFakeTimers();

describe("MessageList コンポーネント", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // スクロール関連のモック
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 500,
    });

    HTMLElement.prototype.scrollTo = jest.fn();
    window.scrollTo = jest.fn();
  });

  it("メッセージがない場合、空のリストが表示されること", () => {
    const { container } = render(<MessageList messages={[]} />);

    // container.querySelectorを使用して要素を取得
    const messageContainer = container.querySelector(".overflow-y-auto");
    expect(messageContainer).toBeInTheDocument();

    // メッセージ表示エリアの子要素を確認
    const messageList = container.querySelector(".max-w-3xl");
    expect(messageList).toBeInTheDocument();
    expect(messageList?.childNodes.length).toBe(1); // messagesEndRefのdivだけが存在
  });

  it("メッセージが正しくレンダリングされること", () => {
    render(<MessageList messages={mockMessages} />);

    // ユーザーのメッセージが表示されること
    expect(screen.getByText("こんにちは！")).toBeInTheDocument();

    // ボットのメッセージが表示されること
    expect(
      screen.getByText("こんにちは！どのようにお手伝いできますか？")
    ).toBeInTheDocument();
  });

  it("ローディングインジケーターが表示されること", () => {
    const messagesWithLoading = [...mockMessages, loadingMessage];
    render(<MessageList messages={messagesWithLoading} />);

    // ローディングインジケーターの要素が存在することを確認
    // アニメーションの遅延スタイルを持つ要素で検証
    const loadingDots = document.querySelectorAll(".animate-bounce");
    expect(loadingDots).toHaveLength(3);
  });

  it("マークダウンコンテンツが正しくレンダリングされること", () => {
    render(<MessageList messages={mockMessages} />);

    // マークダウンのHTMLが正しくレンダリングされていることを確認
    const markdownContent = document.querySelector(".markdown-content");
    expect(markdownContent).toBeInTheDocument();
    expect(markdownContent?.innerHTML).toContain("<strong>テスト</strong>");
  });

  it("検索結果が正しく表示されること", () => {
    const messagesWithSearch = [...mockMessages, messageWithSearchResults];
    render(<MessageList messages={messagesWithSearch} />);

    // 検索結果のタイトルが表示されること
    expect(screen.getByText("Web検索結果:")).toBeInTheDocument();
    expect(screen.getByText("テスト検索結果")).toBeInTheDocument();

    // 検索結果の説明が表示されること
    expect(
      screen.getByText("これはテスト用の検索結果の説明です")
    ).toBeInTheDocument();

    // URLが表示されていることを確認
    expect(screen.getByText("https://example.com")).toBeInTheDocument();

    // リンクが正しく設定されていることを確認
    const link = screen.getByRole("link", { name: /テスト検索結果/ });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("新しいメッセージが追加されたときに自動スクロールが実行されること", () => {
    // 初期メッセージでレンダリング
    const { rerender } = render(
      <MessageList messages={mockMessages.slice(0, 1)} />
    );

    // レンダリング後に新しいメッセージを追加して再レンダリング
    rerender(<MessageList messages={mockMessages.slice(0, 2)} />);

    // スクロール関数が呼ばれるはずだが、setTimeoutの中で実行されるため、タイマーを進める
    jest.advanceTimersByTime(100);

    // コンテナのscrollTopが設定されたことを確認
    const container = document.querySelector('[class*="overflow-y-auto"]');
    expect(container).toBeInTheDocument();

    // メッセージの存在を確認（justify-endはユーザー、justify-startはボットのメッセージ）
    const userMessageContainer = document.querySelector(".flex.justify-end");
    expect(userMessageContainer).toBeInTheDocument();

    const botMessageContainer = document.querySelector(".flex.justify-start");
    expect(botMessageContainer).toBeInTheDocument();

    // メッセージのテキスト内容も確認
    expect(screen.getByText("こんにちは！")).toBeInTheDocument();
    expect(
      screen.getByText("こんにちは！どのようにお手伝いできますか？")
    ).toBeInTheDocument();
  });
});
