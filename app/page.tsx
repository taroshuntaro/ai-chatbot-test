/**
 * チャットボットアプリケーションのメインページコンポーネント
 *
 * このコンポーネントは、チャットインターフェースの主要な機能を実装しています：
 * - メッセージリストの表示と管理
 * - ユーザー入力の処理
 * - OpenAI APIとの通信によるチャットボット応答の取得
 * - ローディング状態やエラーハンドリングの管理
 * - LLMモデルの選択機能
 *
 * @module Home
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageList from "@/components/MessageList";
import InputBar from "@/components/InputBar";
import { getChatbotResponse } from "@/utils/openaiApi";
import { Message } from "@/types/message";
import { OpenAIModel, DEFAULT_MODEL } from "@/types/model";

const MODEL_STORAGE_KEY = "preferred-ai-model";

const Home = () => {
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
  // 選択されたモデルの状態管理
  const [selectedModel, setSelectedModel] =
    useState<OpenAIModel>(DEFAULT_MODEL);
  // リクエスト処理中かどうかを追跡するref
  const processingRef = useRef<boolean>(false);

  // ローカルストレージから保存されたモデル設定を読み込む
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      if (
        savedModel &&
        (savedModel === "gpt-3.5-turbo" || savedModel === "gpt-4o-mini")
      ) {
        setSelectedModel(savedModel);
      }
    }
  }, []);

  // モデル選択が変更されたときの処理
  const handleModelChange = (model: OpenAIModel) => {
    setSelectedModel(model);
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  };

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
    (inputText: string): string => inputText.trim(),
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
          controller.signal,
          selectedModel
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
  }, [input, generateMessageId, sanitizeInput, selectedModel]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="w-full p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            AI チャットボット
          </h1>
        </div>
      </div>
      <MessageList messages={messages} />
      <InputBar
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        setMessages={setMessages}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />
    </div>
  );
};

export default Home;
