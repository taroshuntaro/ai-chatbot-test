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

import { useEffect, useRef, FC, useMemo } from "react";
import { Message } from "@/types/message";
import { MessageBubble } from "@/components/message/MessageBubble";

interface MessageListProps {
  messages: Message[];
}

/**
 * 自動スクロールのトリガーとなる下部までの距離（ピクセル）
 */
export const AUTO_SCROLL_THRESHOLD_PX = 30;

/**
 * コピー成功表示の持続時間（ミリ秒）
 */
export const COPY_FEEDBACK_DURATION_MS = 2000;

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
   * コンテナを最下部にスクロールする関数
   *
   * 新しいメッセージが追加された時にチャットの最下部に自動的にスクロールします
   * スムーズなスクロール効果を適用します
   */
  const scrollToBottom = () => {
    if (containerRef.current && shouldAutoScrollRef.current) {
      try {
        const container = containerRef.current;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      } catch (error) {
        console.error("スクロール処理中にエラーが発生しました:", error);
      }
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
      try {
        const { scrollTop, scrollHeight, clientHeight } = container;
        // スクロール位置が最下部から閾値以内なら自動スクロールを有効にする
        const isNearBottom =
          scrollHeight - scrollTop - clientHeight < AUTO_SCROLL_THRESHOLD_PX;
        shouldAutoScrollRef.current = isNearBottom;
      } catch (error) {
        console.error("スクロールイベント処理中にエラーが発生しました:", error);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // メッセージリストが更新されたときに自動スクロールを実行
  useEffect(() => {
    try {
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
    } catch (error) {
      console.error("メッセージ更新処理中にエラーが発生しました:", error);
    }
  }, [messages]);

  // useMemoを使用して不要な再計算を避ける
  const messageElements = useMemo(() => {
    return messages.map((message, index) => {
      // コピーボタンを表示すべきかどうかを判断
      const showCopyButton = (() => {
        if (message.isLoading || message.sender !== "bot") {
          return false;
        }

        // ボットからの最初のメッセージかどうかを判断
        const firstBotMessageIndex = messages.findIndex(
          (msg) => msg.sender === "bot"
        );
        return index !== firstBotMessageIndex;
      })();

      return (
        <div
          key={message.id}
          className={`mb-4 ${
            message.sender === "bot" ? "flex justify-start" : "flex justify-end"
          }`}
        >
          <MessageBubble message={message} showCopyButton={showCopyButton} />
        </div>
      );
    });
  }, [messages]);

  return (
    <div className="relative flex-1 w-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 bg-gray-50 dark:bg-gray-800 transition-colors duration-200"
        style={{ paddingTop: "1rem", paddingBottom: "6rem" }}
      >
        <div className="max-w-3xl mx-auto">
          {messageElements}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MessageList;
