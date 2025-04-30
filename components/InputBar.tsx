"use client";

import {
  useState,
  FC,
  ChangeEvent,
  KeyboardEvent,
  useRef,
  useCallback,
} from "react";
import { getChatbotResponse } from "@/utils/openaiApi";
import { Message } from "@/types/message";
import { v4 as uuidv4 } from "uuid";
import DOMPurify from "dompurify";

interface InputBarProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

// レート制限のための定数
const RATE_LIMIT_TIMEOUT = 500; // ms単位
const MAX_INPUT_LENGTH = 1000; // 入力の最大文字数

const InputBar: FC<InputBarProps> = ({ input, setInput, setMessages }) => {
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const lastRequestTime = useRef<number>(0);

  // 入力のサニタイズと検証
  const sanitizeInput = useCallback((text: string): string => {
    // XSS対策: DOMPurifyを使用してHTMLタグやスクリプトを無効化
    const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });

    // 最大長を制限
    return sanitized.substring(0, MAX_INPUT_LENGTH);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    // 入力時のサニタイズ
    const sanitizedInput = sanitizeInput(e.target.value);
    setInput(sanitizedInput);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !isComposing && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // レート制限チェック
    const now = Date.now();
    if (now - lastRequestTime.current < RATE_LIMIT_TIMEOUT) {
      return; // リクエストを無視
    }
    lastRequestTime.current = now;

    const userMessage = sanitizeInput(input.trim());
    setInput("");

    // ユーザーのメッセージを追加
    const userMessageId = uuidv4();
    setMessages((prev: Message[]) => [
      ...prev,
      { id: userMessageId, sender: "user", text: userMessage },
    ]);

    try {
      setIsLoading(true);

      // 処理中を表すボットのメッセージを追加
      const loadingMessageId = uuidv4();
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: loadingMessageId,
          sender: "bot",
          text: "",
          isLoading: true,
        },
      ]);

      // OpenAI APIからの応答を取得 (タイムアウト付き)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒でタイムアウト

      const response = await getChatbotResponse(userMessage, controller.signal);
      clearTimeout(timeoutId);

      // 処理中メッセージを削除し、実際の応答を追加
      setMessages((prev: Message[]) => {
        // 処理中メッセージをフィルタリングして削除
        const filteredMessages = prev.filter(
          (msg) => msg.id !== loadingMessageId
        );
        // 実際の応答を追加
        return [
          ...filteredMessages,
          {
            id: uuidv4(),
            sender: "bot",
            text: response.text,
            html: response.html,
            isMarkdown: response.isMarkdown,
          },
        ];
      });
    } catch (error) {
      console.error("Error fetching chatbot response:", error);

      // 処理中メッセージを削除し、エラーメッセージを追加
      setMessages((prev: Message[]) => {
        const filteredMessages = prev.filter((msg) => !msg.isLoading);
        return [
          ...filteredMessages,
          {
            id: uuidv4(),
            sender: "bot",
            text: "エラーが発生しました。もう一度お試しください。",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-white dark:bg-gray-800 shadow-inner border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-3xl mx-auto flex items-center">
        <textarea
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none h-16 bg-white dark:bg-gray-700 text-black dark:text-white"
          placeholder="メッセージを入力..."
          aria-label="メッセージ入力"
          disabled={isLoading}
          maxLength={MAX_INPUT_LENGTH}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          className={`ml-4 p-3 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-transform transform active:scale-95 ${
            input.trim() && !isLoading
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          }`}
          aria-label="送信"
        >
          {isLoading ? (
            <span className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            "送信"
          )}
        </button>
      </div>
    </div>
  );
};

export default InputBar;
