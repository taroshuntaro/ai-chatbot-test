import React from "react";
import { render, screen } from "@testing-library/react";
import { MessageContent } from "@/components/message/MessageContent";
import { Message } from "@/types/message";
import "@testing-library/jest-dom";

// LoadingIndicator コンポーネントをモック
jest.mock("@/components/message/LoadingIndicator", () => ({
  LoadingIndicator: () => (
    <div data-testid="loading-indicator">読み込み中...</div>
  ),
}));

// SearchResultsDisplay コンポーネントをモック
jest.mock("@/components/message/SearchResultsDisplay", () => ({
  SearchResultsDisplay: ({ results }: { results: any[] }) => (
    <div data-testid="search-results">{results.length} 件の検索結果</div>
  ),
}));

describe("MessageContent コンポーネント", () => {
  // テスト用のメッセージデータ
  const textMessage: Message = {
    id: "text-1",
    text: "通常のテキストメッセージ",
    sender: "bot",
    timestamp: new Date().toISOString(),
  };

  const markdownMessage: Message = {
    id: "markdown-1",
    text: "**マークダウン**メッセージ",
    html: "<strong>マークダウン</strong>メッセージ",
    sender: "bot",
    timestamp: new Date().toISOString(),
    isMarkdown: true,
  };

  const loadingMessage: Message = {
    id: "loading-1",
    text: "",
    sender: "bot",
    timestamp: new Date().toISOString(),
    isLoading: true,
  };

  const searchResultsMessage: Message = {
    id: "search-1",
    text: "検索結果付きメッセージ",
    sender: "bot",
    timestamp: new Date().toISOString(),
    searchResults: [
      {
        title: "検索結果1",
        description: "検索結果の説明1",
        url: "https://example.com/1",
      },
      {
        title: "検索結果2",
        description: "検索結果の説明2",
        url: "https://example.com/2",
      },
    ],
  };

  it("テキストメッセージが正しくレンダリングされること", () => {
    render(<MessageContent message={textMessage} />);

    // テキストが表示されることを確認
    expect(screen.getByText("通常のテキストメッセージ")).toBeInTheDocument();

    // ローディングインジケーターが表示されないことを確認
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();

    // 検索結果が表示されないことを確認
    expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();
  });

  it("マークダウンメッセージが正しくレンダリングされること", () => {
    const { container } = render(<MessageContent message={markdownMessage} />);

    // マークダウンのHTMLが正しく展開されることを確認
    // querySelector を使用して直接要素を取得
    const markdownContainer = container.querySelector(".markdown-content");
    expect(markdownContainer).toBeInTheDocument();
    expect(markdownContainer?.innerHTML).toBe(
      "<strong>マークダウン</strong>メッセージ"
    );
  });

  it("ローディングメッセージが正しくレンダリングされること", () => {
    render(<MessageContent message={loadingMessage} />);

    // ローディングインジケーターが表示されることを確認
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();

    // 通常のメッセージコンテンツが表示されないことを確認
    // 具体的なテキスト内容ではなく、要素の有無で確認
    expect(screen.queryByText(/通常/)).not.toBeInTheDocument();
  });

  it("検索結果付きメッセージが正しくレンダリングされること", () => {
    render(<MessageContent message={searchResultsMessage} />);

    // メッセージのテキストが表示されることを確認
    expect(screen.getByText("検索結果付きメッセージ")).toBeInTheDocument();

    // 検索結果が表示されることを確認
    expect(screen.getByTestId("search-results")).toBeInTheDocument();
    expect(screen.getByText("2 件の検索結果")).toBeInTheDocument();
  });
});
