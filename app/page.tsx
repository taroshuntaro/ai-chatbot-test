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

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageList from "@/components/MessageList";
import InputBar from "@/components/InputBar";
import { getChatbotResponse } from "@/utils/openaiApi";
import { Message } from "@/types/message";
import { OpenAIModel, DEFAULT_MODEL, AVAILABLE_MODELS } from "@/types/model";

/**
 * アプリケーション設定の定数
 */
const APP_CONFIG = {
  /**
   * ローカルストレージのキー
   */
  MODEL_STORAGE_KEY: "preferred-ai-model",

  /**
   * 初期ウェルカムメッセージID（固定値）
   */
  INITIAL_MESSAGE_ID: "welcome-message-id",

  /**
   * APIリクエストのタイムアウト時間（ミリ秒）
   */
  REQUEST_TIMEOUT_MS: 30000,

  /**
   * 初期ウェルカムメッセージ
   */
  WELCOME_MESSAGE: "こんにちは！何をお手伝いしましょうか？",

  /**
   * ローディング中のメッセージ
   */
  LOADING_MESSAGE: "お返事を考えています...",

  /**
   * アプリケーションのタイトル
   */
  APP_TITLE: "AI チャットボット",
};

/**
 * エラーメッセージの定数
 */
const ERROR_MESSAGES = {
  /**
   * 一般的なエラーメッセージのプレフィックス
   */
  PREFIX: "エラーが発生しました: ",

  /**
   * 不明なエラーの場合のメッセージ
   */
  UNKNOWN: "不明なエラー",
};

/**
 * スタイル関連の定数
 */
const STYLES = {
  /**
   * アプリのコンテナスタイル
   */
  CONTAINER:
    "flex flex-col h-screen bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200",

  /**
   * ヘッダー部分のスタイル
   */
  HEADER:
    "w-full p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm",

  /**
   * ヘッダー内のコンテンツスタイル
   */
  HEADER_CONTENT: "max-w-3xl mx-auto flex justify-between items-center",

  /**
   * アプリタイトルのスタイル
   */
  TITLE: "text-xl font-semibold text-gray-800 dark:text-white",

  /**
   * ローディング時のメッセージコンテナ
   */
  LOADING_MESSAGE_CONTAINER: "flex-1 overflow-y-auto p-4",

  /**
   * ローディング時のメッセージ表示エリア
   */
  LOADING_MESSAGE_AREA: "max-w-3xl mx-auto",

  /**
   * ローディング時のメッセージスタイル
   */
  LOADING_MESSAGE_BUBBLE: "flex mb-4",

  /**
   * ローディング時のメッセージバブルのスタイル
   */
  BOT_MESSAGE:
    "bg-blue-100 dark:bg-blue-900 rounded-lg py-2 px-4 max-w-xs md:max-w-md lg:max-w-lg",

  /**
   * ローディング時のメッセージテキストスタイル
   */
  MESSAGE_TEXT: "text-gray-800 dark:text-gray-200",

  /**
   * ローディング時の入力エリアのスタイル
   */
  LOADING_INPUT_AREA:
    "p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",

  /**
   * ローディング時の入力コンテナのスタイル
   */
  LOADING_INPUT_CONTAINER: "max-w-3xl mx-auto",

  /**
   * ローディング時の入力フォームスタイル
   */
  LOADING_INPUT_FORM: "flex items-center",

  /**
   * ローディング時のテキストエリアスタイル
   */
  LOADING_TEXTAREA:
    "flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50",

  /**
   * ローディング時の送信ボタンスタイル
   */
  LOADING_BUTTON:
    "bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50",
};

/**
 * ローカルストレージからモデル設定を読み込む関数
 *
 * @returns 保存されたモデル設定、または無効な場合はデフォルトモデル
 */
function loadModelFromStorage(): OpenAIModel {
  try {
    // クライアントサイドでのみlocalStorageを使用
    if (typeof window === "undefined") {
      return DEFAULT_MODEL;
    }

    const savedModel = localStorage.getItem(APP_CONFIG.MODEL_STORAGE_KEY);
    console.log(`保存されたモデルを読み込み: ${savedModel}`);

    // 保存されたモデルが有効なモデルタイプであるかチェック
    if (savedModel && AVAILABLE_MODELS.includes(savedModel as OpenAIModel)) {
      console.log(`有効なモデルを設定: ${savedModel}`);
      return savedModel as OpenAIModel;
    } else {
      console.log(
        `無効または存在しないモデル。デフォルトを使用: ${DEFAULT_MODEL}`
      );
      return DEFAULT_MODEL;
    }
  } catch (error) {
    console.error("モデル設定の読み込み中にエラーが発生しました:", error);
    // エラーが発生した場合はデフォルトモデルを使用
    return DEFAULT_MODEL;
  }
}

/**
 * ローカルストレージにモデル設定を保存する関数
 *
 * @param model 保存するモデル設定
 */
function saveModelToStorage(model: OpenAIModel): void {
  try {
    localStorage.setItem(APP_CONFIG.MODEL_STORAGE_KEY, model);
    console.log(`モデル設定を保存: ${model}`);
  } catch (error) {
    console.error("モデル設定の保存中にエラーが発生しました:", error);
  }
}

/**
 * ローディング中のUIを表示するコンポーネント
 * クライアントサイドレンダリングの前に表示されるスケルトンUI
 *
 * @returns ローディングUI要素
 */
function LoadingUI() {
  return (
    <div className={STYLES.CONTAINER}>
      <div className={STYLES.HEADER}>
        <div className={STYLES.HEADER_CONTENT}>
          <h1 className={STYLES.TITLE}>{APP_CONFIG.APP_TITLE}</h1>
        </div>
      </div>
      <div className={STYLES.LOADING_MESSAGE_CONTAINER}>
        {/* 初期メッセージのみを表示 */}
        <div className={STYLES.LOADING_MESSAGE_AREA}>
          <div className={STYLES.LOADING_MESSAGE_BUBBLE}>
            <div className={STYLES.BOT_MESSAGE}>
              <p className={STYLES.MESSAGE_TEXT}>
                {APP_CONFIG.WELCOME_MESSAGE}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className={STYLES.LOADING_INPUT_AREA}>
        <div className={STYLES.LOADING_INPUT_CONTAINER}>
          <div className={STYLES.LOADING_INPUT_FORM}>
            <textarea
              className={STYLES.LOADING_TEXTAREA}
              placeholder="読み込み中..."
              rows={1}
              disabled
              aria-label="メッセージ入力欄（読み込み中）"
            />
            <button
              className={STYLES.LOADING_BUTTON}
              disabled
              aria-label="送信ボタン（読み込み中）"
            >
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * チャットボットアプリケーションのメインコンポーネント
 */
const Home = () => {
  // メッセージの状態管理（初期メッセージを含む）
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: APP_CONFIG.WELCOME_MESSAGE,
      id: APP_CONFIG.INITIAL_MESSAGE_ID,
    },
  ]);

  // ユーザー入力の状態管理
  const [input, setInput] = useState<string>("");

  // 選択されたモデルの状態管理
  const [selectedModel, setSelectedModel] =
    useState<OpenAIModel>(DEFAULT_MODEL);

  // リクエスト処理中かどうかを追跡するref
  const processingRef = useRef<boolean>(false);

  // クライアントサイドでの処理を示すフラグ
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドレンダリングのフラグを設定
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ローカルストレージから保存されたモデル設定を読み込む
  // クライアントサイドでのみ実行
  useEffect(() => {
    if (!isClient) return;

    const savedModel = loadModelFromStorage();
    setSelectedModel(savedModel);
  }, [isClient]);

  /**
   * モデル選択が変更されたときの処理
   *
   * @param model 選択されたモデル
   */
  function handleModelChange(model: OpenAIModel) {
    console.log(`モデルを変更: ${model}`);
    setSelectedModel(model);

    // クライアントサイドでのみlocalStorageを使用
    if (isClient) {
      saveModelToStorage(model);
    }
  }

  /**
   * 一意のメッセージIDを生成する関数
   * @returns 一意のUUID
   */
  function generateMessageId() {
    return uuidv4();
  }

  /**
   * ユーザー入力をサニタイズする関数
   * 入力の前後の空白を削除
   *
   * @param inputText ユーザー入力テキスト
   * @returns サニタイズされたテキスト
   */
  function sanitizeInput(inputText: string): string {
    return inputText.trim();
  }

  /**
   * APIからの応答取得とメッセージ更新を行う関数
   *
   * @param sanitizedInput サニタイズされたユーザー入力
   * @param loadingMessageId ローディングメッセージのID
   */
  async function fetchBotResponse(
    sanitizedInput: string,
    loadingMessageId: string
  ) {
    // OpenAI APIを呼び出して応答を取得
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      APP_CONFIG.REQUEST_TIMEOUT_MS
    );

    try {
      console.log(`APIリクエスト送信 - 選択モデル: ${selectedModel}`);
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
            text: `${ERROR_MESSAGES.PREFIX}${
              error.message || ERROR_MESSAGES.UNKNOWN
            }`,
            id: generateMessageId(),
          },
        ];
      });
    }
  }

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
   * エラーハンドリングとタイムアウト処理も実装
   */
  async function handleSend() {
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
          text: APP_CONFIG.LOADING_MESSAGE,
          id: loadingMessageId,
          isLoading: true,
        },
      ]);

      // APIからの応答を取得
      await fetchBotResponse(sanitizedInput, loadingMessageId);
    } finally {
      processingRef.current = false;
    }
  }

  // クライアントサイドレンダリングが完了するまで最小限のUIを表示
  if (!isClient) {
    return <LoadingUI />;
  }

  return (
    <div className={STYLES.CONTAINER}>
      <div className={STYLES.HEADER}>
        <div className={STYLES.HEADER_CONTENT}>
          <h1 className={STYLES.TITLE}>{APP_CONFIG.APP_TITLE}</h1>
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
