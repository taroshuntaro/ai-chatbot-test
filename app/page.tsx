/**
 * チャットボットアプリケーションのメインページコンポーネント
 *
 * このコンポーネントは、チャットインターフェースの主要な機能を実装しています：
 * - メッセージリストの表示と管理
 * - ユーザー入力の処理
 * - OpenAI APIとの通信によるチャットボット応答の取得
 * - ローディング状態やエラーハンドリングの管理
 *
 * @module Home
 */
"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageList from "@/components/MessageList";
import InputBar from "@/components/InputBar";
import { getChatbotResponse } from "@/utils/openaiApi";
import { Message } from "@/types/message";

const Home: React.FC = () => {
  // メッセージの状態管理（初期メッセージを含む）
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "こんにちは！何をお手伝いしましょうか？",
      id: uuidv4(),
    },
  ]);
  // ユーザー入力の状態管理
  const [input, setInput] = useState<string>("");
  // リクエスト処理中かどうかを追跡するref
  const processingRef = useRef<boolean>(false);

  /**
   * 一意のメッセージIDを生成する関数
   * @returns 一意のUUID
   */
  const generateMessageId = useCallback(() => uuidv4(), []);

  /**
   * ユーザー入力をサニタイズする関数
   * 入力の前後の空白を削除
   *
   * @param input ユーザー入力テキスト
   * @returns サニタイズされたテキスト
   */
  const sanitizeInput = useCallback(
    (input: string): string => input.trim(),
    []
  );

  /**
   * メッセージ送信処理を行う関数
   *
   * 処理フロー:
   * 1. 入力の検証と処理中チェック
   * 2. ユーザーメッセージの追加
   * 3. ローディングメッセージの表示
   * 4. OpenAI APIからの応答取得
   * 5. 応答メッセージの表示とローディングの削除
   *
   * エラーハンドリングとタイムアウト処理（30秒）も実装
   */
  const handleSend = useCallback(async () => {
    // 空のメッセージ送信や多重送信の防止
    if (input.trim() === "" || processingRef.current) return;

    processingRef.current = true;
    const sanitizedInput = sanitizeInput(input);
    setInput("");

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

      // ローディングメッセージ追加
      const loadingMessageId = generateMessageId();
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
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await getChatbotResponse(
          sanitizedInput,
          controller.signal
        );
        clearTimeout(timeoutId);

        // ローディングメッセージを削除し、実際の応答メッセージを追加
        setMessages((prev) => {
          const filteredMessages = prev.filter(
            (msg) => msg.id !== loadingMessageId
          );

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
          const filteredMessages = prev.filter(
            (msg) => msg.id !== loadingMessageId
          );

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
      processingRef.current = false;
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
