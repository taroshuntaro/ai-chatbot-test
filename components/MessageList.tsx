"use client";

import { useEffect, useRef, FC } from "react";
import { Message } from "@/types/message";

interface MessageListProps {
  messages: Message[];
}

// 処理中アニメーションコンポーネント
const LoadingIndicator: FC = () => {
  return (
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
};

const MessageList: FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  // スクロール関数
  const scrollToBottom = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      // ヘッダーの高さ（pt-16 = 4rem = 64px）+ 余白
      const headerOffset = 70;
      // コンテナの下部までスクロール（ヘッダーの高さを考慮）
      container.scrollTop = container.scrollHeight - container.clientHeight;

      // 画面全体のスクロールも必要な場合はこちらを使用
      if (window.scrollY > 0) {
        window.scrollTo({
          top: headerOffset,
          behavior: "smooth",
        });
      }
    }
  };

  useEffect(() => {
    // メッセージが追加されたかどうかをチェック
    const prevMessagesLength = prevMessagesLengthRef.current;
    const newMessageAdded = messages.length > prevMessagesLength;

    // 新しいメッセージが追加された場合（初期表示時以外）
    if (newMessageAdded && prevMessagesLength > 0) {
      // DOMの更新が確実に完了した後でスクロールを実行するために
      // requestAnimationFrameを使用
      requestAnimationFrame(() => {
        // さらに確実にするため、少し遅延を追加
        setTimeout(scrollToBottom, 50);
      });
    }

    // 現在のメッセージ数を記録
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // メッセージコンテンツをレンダリングする関数
  const renderMessageContent = (message: Message) => {
    if (message.isLoading) {
      return <LoadingIndicator />;
    }

    // マークダウンからHTMLに変換されたコンテンツがある場合、HTMLとして表示
    if (message.isMarkdown && message.html) {
      return (
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: message.html }}
        />
      );
    }

    // 通常のテキストとして表示
    return message.text;
  };

  return (
    <div className="relative flex-1 w-full h-screen flex flex-col pt-16">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 bg-gray-50 dark:bg-gray-800 transition-colors duration-200"
        style={{ paddingTop: "1rem", paddingBottom: "6rem" }}
      >
        <div className="max-w-3xl mx-auto">
          {messages.map((message, index) => (
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
