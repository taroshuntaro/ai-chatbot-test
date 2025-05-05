/**
 * コピーボタンコンポーネント
 *
 * メッセージをクリップボードにコピーするためのボタンを提供します
 * コピー成功時に視覚的フィードバックを表示します
 */
import { FC, useState } from "react";

// MessageListコンポーネントから定数をインポート
import { COPY_FEEDBACK_DURATION_MS } from "@/components/MessageList";

interface CopyButtonProps {
  text: string;
}

export const CopyButton: FC<CopyButtonProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  /**
   * コピー処理を実行する関数
   *
   * テキストをクリップボードにコピーし、一定時間後にコピー状態表示を解除します
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // コピー成功表示は一定時間後に消す
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    } catch (err) {
      console.error("コピーに失敗しました", err);
      // エラー発生時でも状態をリセット
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
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
