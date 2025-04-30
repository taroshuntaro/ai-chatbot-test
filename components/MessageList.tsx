"use client";

import { useEffect, useState, useRef, FC } from "react";
import { Message } from "@/app/page";

interface MessageListProps {
  messages: Message[];
}

const MessageList: FC<MessageListProps> = ({ messages }) => {
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastMessageIndex, setLastMessageIndex] = useState<number>(
    messages.length - 1
  );

  // 新しいメッセージをヘッダーの真下に表示するスクロール処理
  const scrollToLatestMessage = () => {
    if (latestMessageRef.current && containerRef.current) {
      // メッセージ要素の位置を取得し、ヘッダーの高さを考慮して調整
      const headerHeight = 64; // ヘッダーの高さ
      const container = containerRef.current;
      const messageElement = latestMessageRef.current;
      const messagePosition = messageElement.offsetTop;

      // ヘッダーの真下に表示するようにスクロール位置を設定
      container.scrollTop = messagePosition - headerHeight - 20; // 20pxの余白を追加
    }
  };

  // 新しいメッセージが追加されたときに実行
  useEffect(() => {
    if (messages.length > lastMessageIndex) {
      // 新しいメッセージが追加された場合のみスクロール
      setLastMessageIndex(messages.length - 1);

      // スクロールを確実に実行するため複数のタイミングで実行
      // requestAnimationFrameを使用して描画タイミングで実行
      const rafId = requestAnimationFrame(scrollToLatestMessage);

      // 短い遅延でも実行
      const shortTimeoutId = setTimeout(scrollToLatestMessage, 100);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(shortTimeoutId);
      };
    }
  }, [messages.length, lastMessageIndex]);

  return (
    <div className="relative flex-1 w-full pt-16">
      {" "}
      {/* 上部の固定部分のスペースを確保 */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto p-6 px-4 sm:px-8 bg-gray-50 dark:bg-gray-800 transition-colors duration-200"
        style={{ paddingBottom: "5rem" }} // 入力バーのスペースを確保
      >
        {messages.map((message) => (
          <div
            key={message.id}
            // 最新のメッセージの場合は参照を設定
            ref={
              message.id === messages[messages.length - 1].id
                ? latestMessageRef
                : null
            }
            className={`flex mb-4 ${
              message.sender === "bot" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-xs p-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 whitespace-pre-wrap ${
                message.sender === "bot"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-black dark:text-white"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageList;
