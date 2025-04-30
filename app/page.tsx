"use client";

import { useState, useCallback, useRef } from "react";
import MessageList from "../components/MessageList";
import InputBar from "../components/InputBar";
import { v4 as uuidv4 } from "uuid";
import { getChatbotResponse } from "../utils/openaiApi";
import { Message } from "@/types/message";

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "こんにちは！何をお手伝いしましょうか？",
      id: uuidv4(),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const processingRef = useRef<boolean>(false); // 処理中かどうかを追跡

  // メッセージIDを生成する関数
  const generateMessageId = useCallback(() => {
    return uuidv4();
  }, []);

  // 入力文字列を検証・サニタイズする関数
  const sanitizeInput = useCallback((input: string): string => {
    // 基本的なサニタイズ (XSS対策)
    return input.trim();
  }, []);

  const handleSend = useCallback(async () => {
    if (input.trim() === "" || processingRef.current) return;

    processingRef.current = true; // 処理中フラグをセット
    const sanitizedInput = sanitizeInput(input);
    setInput(""); // 先に入力をクリア

    try {
      // ユーザーメッセージ追加
      const userMessageId = generateMessageId();
      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: sanitizedInput,
          id: userMessageId,
        },
      ]);

      // ローディングメッセージのID
      const loadingMessageId = generateMessageId();

      // ボットのローディングメッセージを追加
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "お返事を考えています...",
          id: loadingMessageId,
          isLoading: true,
        },
      ]);

      // OpenAI APIを呼び出して応答を取得
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒でタイムアウト

      try {
        const response = await getChatbotResponse(
          sanitizedInput,
          controller.signal
        );
        clearTimeout(timeoutId);

        // ローディングメッセージを削除し、実際の応答メッセージを追加
        setMessages((prev) => {
          // ローディングメッセージを削除
          const filteredMessages = prev.filter(
            (msg) => msg.id !== loadingMessageId
          );

          // 新しいボットメッセージを追加
          return [
            ...filteredMessages,
            {
              sender: "bot",
              text: response.text,
              html: response.html,
              isMarkdown: response.isMarkdown,
              id: generateMessageId(),
            },
          ];
        });
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("Error fetching response:", error);

        // ローディングメッセージを削除し、エラーメッセージを追加
        setMessages((prev) => {
          // ローディングメッセージを削除
          const filteredMessages = prev.filter(
            (msg) => msg.id !== loadingMessageId
          );

          // エラーメッセージを追加
          return [
            ...filteredMessages,
            {
              sender: "bot",
              text: `エラーが発生しました: ${error.message || "不明なエラー"}`,
              id: generateMessageId(),
            },
          ];
        });
      }
    } finally {
      processingRef.current = false; // 処理完了フラグをリセット
    }
  }, [input, generateMessageId, sanitizeInput]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200">
      <MessageList messages={messages} />
      <InputBar
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        setMessages={setMessages}
      />
    </div>
  );
};

export default Home;
