/**
 * チャットメッセージ一覧表示コンポーネント
 *
 * このコンポーネントは、チャットインターフェース内のメッセージを表示する役割を担います。
 * 主な機能:
 * - ユーザーとボットのメッセージの視覚的区別
 * - 新しいメッセージが追加された際の自動スクロール
 * - ローディング状態のアニメーション表示
 * - MarkdownコンテンツのHTMLレンダリング
 * - Web検索結果の表示（拡張機能）
 *
 * @module MessageList
 */
"use client";

import { useEffect, useRef, FC } from "react";
import { Message, SearchResult } from "@/types/message";

interface MessageListProps {
  messages: Message[];
}

/**
 * ローディングインジケーターコンポーネント
 *
 * ボットの応答待ち状態を視覚的に表現するためのアニメーション付きドット
 * アニメーションの遅延をずらすことで波のような動きを実現しています
 */
const LoadingIndicator: FC = () => (
  <div className="flex space-x-2 items-center">
    <div
      className="w-2 h-2 bg-white rounded-full animate-bounce"
      style={{ animationDelay: "0ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-white rounded-full animate-bounce"
      style={{ animationDelay: "150ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-white rounded-full animate-bounce"
      style={{ animationDelay: "300ms" }}
    ></div>
  </div>
);

/**
 * Web検索結果表示コンポーネント
 *
 * AIが外部情報を使用した場合に、参照した検索結果を表示します
 * 各検索結果はクリック可能なリンクとして表示されます
 *
 * @param results 検索結果配列
 */
const SearchResultsDisplay: FC<{ results: SearchResult[] }> = ({ results }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="mt-3 border-t pt-3 border-gray-300 dark:border-gray-500">
      <h4 className="font-semibold mb-2">Web検索結果:</h4>
      <div className="space-y-3">
        {results.map((result, idx) => (
          <div key={idx} className="hover:bg-blue-700 p-2 rounded">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h5 className="text-sm font-bold underline">{result.title}</h5>
              <p className="text-xs opacity-90">{result.description}</p>
              <p className="text-xs italic mt-1 opacity-70">{result.url}</p>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * メインのメッセージリストコンポーネント
 *
 * メッセージの表示やスクロール処理などを管理する中心的なコンポーネント
 *
 * @param messages 表示するメッセージの配列
 */
const MessageList: FC<MessageListProps> = ({ messages }) => {
  // メッセージリストの最下部への参照
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // メッセージコンテナへの参照（スクロール用）
  const containerRef = useRef<HTMLDivElement>(null);
  // 以前のメッセージ数を追跡するref（新しいメッセージが追加されたかの判定用）
  const prevMessagesLengthRef = useRef<number>(0);

  /**
   * コンテナを最下部にスクロールする関数
   *
   * 新しいメッセージが追加された時にチャットの最下部に自動的にスクロールします
   * ヘッダーのオフセットも考慮して適切なスクロール位置を計算します
   */
  const scrollToBottom = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      const headerOffset = 70;
      container.scrollTop = container.scrollHeight - container.clientHeight;

      if (window.scrollY > 0) {
        window.scrollTo({
          top: headerOffset,
          behavior: "smooth",
        });
      }
    }
  };

  // メッセージリストが更新されたときに自動スクロールを実行
  useEffect(() => {
    const prevMessagesLength = prevMessagesLengthRef.current;
    const newMessageAdded = messages.length > prevMessagesLength;

    // 新しいメッセージが追加された時だけ自動スクロール
    if (newMessageAdded && prevMessagesLength > 0) {
      // レンダリングサイクル後に少し遅延してスクロール実行（描画完了を待つため）
      requestAnimationFrame(() => {
        setTimeout(scrollToBottom, 50);
      });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  /**
   * メッセージコンテンツをレンダリングする関数
   *
   * メッセージの種類（通常/ローディング）や形式（マークダウン/プレーンテキスト）に応じて
   * 適切なレンダリング方法を選択します
   *
   * @param message レンダリングするメッセージオブジェクト
   */
  const renderMessageContent = (message: Message) => {
    if (message.isLoading) {
      return <LoadingIndicator />;
    }

    return (
      <div>
        {message.isMarkdown && message.html ? (
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: message.html }}
          />
        ) : (
          <div>{message.text}</div>
        )}

        {message.searchResults && message.searchResults.length > 0 && (
          <SearchResultsDisplay results={message.searchResults} />
        )}
      </div>
    );
  };

  return (
    <div className="relative flex-1 w-full h-screen flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 bg-gray-50 dark:bg-gray-800 transition-colors duration-200"
        style={{ paddingTop: "1rem", paddingBottom: "6rem" }}
      >
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${
                message.sender === "bot" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`sm:max-w-md md:max-w-lg lg:max-w-xl p-4 rounded-xl shadow-lg transition-transform ${
                  message.isMarkdown ? "" : "whitespace-pre-wrap"
                } ${
                  message.sender === "bot"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 dark:bg-gray-600 text-black dark:text-white"
                }`}
              >
                {renderMessageContent(message)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MessageList;
