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
 * - メッセージのクリップボードへのコピー
 *
 * @module MessageList
 */
"use client";

import { useEffect, useRef, FC, useState } from "react";
import { Message, SearchResult } from "@/types/message";

interface MessageListProps {
  messages: Message[];
}

/**
 * 自動スクロールのトリガーとなる下部までの距離（ピクセル）
 */
const AUTO_SCROLL_THRESHOLD_PX = 30;

/**
 * コピー成功表示の持続時間（ミリ秒）
 */
const COPY_FEEDBACK_DURATION_MS = 2000;

/**
 * ローディングインジケーターコンポーネント
 *
 * ボットの応答待ち状態を視覚的に表現するためのアニメーション付きドット
 * アニメーションの遅延をずらすことで波のような動きを実現しています
 */
const LoadingIndicator: FC = () => (
  <div className="flex space-x-2 items-center">
    <div
      className="w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full animate-bounce"
      style={{ animationDelay: "0ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full animate-bounce"
      style={{ animationDelay: "150ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full animate-bounce"
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
          <div
            key={idx}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
          >
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
 * コピーボタンコンポーネント
 *
 * メッセージをクリップボードにコピーするためのボタンを提供します
 * コピー成功時に視覚的フィードバックを表示します
 */
const CopyButton: FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // コピー成功表示は一定時間後に消す
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    } catch (err) {
      console.error("コピーに失敗しました", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center"
      aria-label="メッセージをコピー"
      title="メッセージをコピー"
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-500"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}
    </button>
  );
};

/**
 * メッセージ内容表示コンポーネント
 *
 * メッセージの種類（通常/ローディング）や形式（マークダウン/プレーンテキスト）に応じて
 * 適切なレンダリング方法を選択します
 */
const MessageContent: FC<{ message: Message }> = ({ message }) => {
  if (message.isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <>
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
    </>
  );
};

/**
 * メッセージバブル表示コンポーネント
 *
 * ユーザー/ボットのメッセージに応じた適切なスタイルでバブルを表示します
 */
const MessageBubble: FC<{
  message: Message;
  showCopyButton: boolean;
}> = ({ message, showCopyButton }) => {
  const isBotMessage = message.sender === "bot";

  return (
    <div className="flex flex-col">
      <div
        className={`${
          isBotMessage
            ? "sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl p-4 transition-transform text-gray-800 dark:text-gray-200"
            : "sm:max-w-md md:max-w-lg lg:max-w-xl p-4 rounded-xl shadow-lg transition-transform bg-gray-300 dark:bg-gray-600 text-black dark:text-white"
        } ${message.isMarkdown ? "" : "whitespace-pre-wrap"} hover:shadow-md`}
      >
        <MessageContent message={message} />
      </div>
      <div className="self-end mt-1">
        {showCopyButton && <CopyButton text={message.text} />}
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
  // 自動スクロールの状態を管理するref
  const shouldAutoScrollRef = useRef<boolean>(true);

  /**
   * コピーボタンを表示すべきかどうかを判断する関数
   *
   * 以下の条件の場合にコピーボタンを表示する：
   * 1. ローディング中でない
   * 2. ボットからのメッセージである
   * 3. 会話の最初のボットメッセージでない（初期挨拶を除外）
   */
  const shouldShowCopyButton = (message: Message, index: number): boolean => {
    if (message.isLoading || message.sender !== "bot") {
      return false;
    }

    // ボットからの最初のメッセージかどうかを判断
    const firstBotMessageIndex = messages.findIndex(
      (msg) => msg.sender === "bot"
    );
    return index !== firstBotMessageIndex;
  };

  /**
   * コンテナを最下部にスクロールする関数
   *
   * 新しいメッセージが追加された時にチャットの最下部に自動的にスクロールします
   * スムーズなスクロール効果を適用します
   */
  const scrollToBottom = () => {
    if (containerRef.current && shouldAutoScrollRef.current) {
      const container = containerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // ユーザーのスクロール操作を検出し、自動スクロールの挙動を制御する
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // スクロールイベントハンドラ
    // ユーザーが上にスクロールすると自動スクロールを無効化し、
    // 最下部に近づくと自動スクロールを再有効化する
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // スクロール位置が最下部から閾値以内なら自動スクロールを有効にする
      const isNearBottom =
        scrollHeight - scrollTop - clientHeight < AUTO_SCROLL_THRESHOLD_PX;
      shouldAutoScrollRef.current = isNearBottom;
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // メッセージリストが更新されたときに自動スクロールを実行
  useEffect(() => {
    const prevMessagesLength = prevMessagesLengthRef.current;
    const newMessageAdded = messages.length > prevMessagesLength;

    // 新しいメッセージが追加された時だけ自動スクロール
    if (newMessageAdded) {
      // レンダリングサイクル後に少し遅延してスクロール実行（描画完了を待つため）
      requestAnimationFrame(() => {
        setTimeout(scrollToBottom, 50);
      });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  return (
    <div className="relative flex-1 w-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 bg-gray-50 dark:bg-gray-800 transition-colors duration-200"
        style={{ paddingTop: "1rem", paddingBottom: "6rem" }}
      >
        <div className="max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`mb-4 ${
                message.sender === "bot"
                  ? "flex justify-start"
                  : "flex justify-end"
              }`}
            >
              <MessageBubble
                message={message}
                showCopyButton={shouldShowCopyButton(message, index)}
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MessageList;
