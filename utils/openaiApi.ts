/**
 * OpenAI APIクライアントユーティリティ
 *
 * このファイルは、フロントエンドとバックエンドのOpenAI APIの間の通信を処理します。
 * 主な機能:
 * - ユーザー入力の検証とサニタイズ
 * - APIリクエストの送信
 * - タイムアウト処理
 * - エラーハンドリングと適切なエラーメッセージの提供
 * - レスポンスデータの型変換と検証
 * - LLMモデル選択のサポート
 *
 * @module openaiApi
 */

import { OpenAIModel, DEFAULT_MODEL } from "@/types/model";

/**
 * 入力文字数の最大値（サーバー側の制限に合わせる）
 */
const MAX_INPUT_LENGTH = 1000;

/**
 * APIエンドポイントURL
 */
const API_ENDPOINT = "/api/openai";

/**
 * エラーメッセージの定数
 */
const ERROR_MESSAGES = {
  EMPTY_INPUT: "入力が必要です",
  RATE_LIMIT:
    "リクエスト回数の制限を超えました。しばらく待ってからお試しください。",
  TIMEOUT: "リクエストがタイムアウトしました。もう一度お試しください。",
  NETWORK: "ネットワークエラーが発生しました。接続を確認してください。",
  INVALID_RESPONSE: "無効なレスポンス形式です",
  DEFAULT: "バックエンドからの応答の取得に失敗しました",
};

/**
 * ユーザー入力をサニタイズする関数
 *
 * @param input ユーザー入力テキスト
 * @returns サニタイズされたテキスト
 */
const sanitizePrompt = (input: string): string => {
  if (!input || input.trim().length === 0) {
    throw new Error(ERROR_MESSAGES.EMPTY_INPUT);
  }
  return input.trim().slice(0, MAX_INPUT_LENGTH);
};

/**
 * バックエンドのOpenAI APIエンドポイントを呼び出してチャットボットの応答を取得する
 *
 * この関数は、ユーザーの入力を適切にサニタイズし、サーバーサイドのAPIに送信します。
 * また、様々なエラーケース（タイムアウト、レート制限、ネットワークエラーなど）を処理し、
 * ユーザーフレンドリーなエラーメッセージを提供します。
 * テストモードの場合もサーバー側でテストレスポンスを生成します。
 *
 * @param prompt ユーザーの質問/入力
 * @param signal AbortSignal（タイムアウト処理用）
 * @param model 使用するLLMモデル
 * @returns テキスト応答、HTML（マークダウンレンダリング済）、フォーマットフラグを含むオブジェクト
 */
export async function getChatbotResponse(
  prompt: string,
  signal?: AbortSignal,
  model: OpenAIModel = DEFAULT_MODEL
): Promise<{ text: string; html?: string; isMarkdown?: boolean }> {
  try {
    // 入力のサニタイズ
    const sanitizedPrompt = sanitizePrompt(prompt);

    // リクエスト情報のログ出力
    console.log(`モデル「${model}」でリクエストを送信します`);

    // サーバーへのリクエスト送信
    const response = await fetchFromBackend(sanitizedPrompt, model, signal);

    // レスポンスデータの解析と検証
    return processResponse(response);
  } catch (error: any) {
    // エラーハンドリング
    return handleApiError(error);
  }
}

/**
 * バックエンドAPIにリクエストを送信する関数
 *
 * @param sanitizedPrompt サニタイズ済みのユーザー入力
 * @param model 使用するLLMモデル
 * @param signal AbortSignal（タイムアウト処理用）
 * @returns サーバーからのレスポンス
 */
async function fetchFromBackend(
  sanitizedPrompt: string,
  model: OpenAIModel,
  signal?: AbortSignal
): Promise<Response> {
  return fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: sanitizedPrompt,
      model: model,
    }),
    signal, // タイムアウトシグナルを渡す
  });
}

/**
 * サーバーからのレスポンスを処理する関数
 *
 * @param response サーバーからのレスポンス
 * @returns 処理済みのレスポンスデータ
 */
async function processResponse(response: Response): Promise<{
  text: string;
  html?: string;
  isMarkdown?: boolean;
}> {
  // エラーレスポンスの処理
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || ERROR_MESSAGES.DEFAULT;

    // 特定のエラーコードに対する詳細なメッセージ
    if (response.status === 429) {
      throw new Error(ERROR_MESSAGES.RATE_LIMIT);
    } else if (response.status === 504) {
      throw new Error(ERROR_MESSAGES.TIMEOUT);
    }

    throw new Error(errorMessage);
  }

  // レスポンスデータの解析
  const data = await response.json();

  // レスポンスデータの検証
  if (!data || typeof data.text !== "string") {
    throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
  }

  // 正常なレスポンスを返却
  return {
    text: data.text || "",
    html: data.html || undefined,
    isMarkdown: data.isMarkdown || false,
  };
}

/**
 * APIエラーを処理する関数
 *
 * @param error 発生したエラー
 * @returns エラーメッセージを含むレスポンス（再スロー）
 */
function handleApiError(error: any): never {
  // タイムアウトエラーの処理
  if (error.name === "AbortError") {
    console.error("Request was aborted", error);
    throw new Error(ERROR_MESSAGES.TIMEOUT);
  }

  // ネットワークエラーの処理
  if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
    console.error("Network error:", error);
    throw new Error(ERROR_MESSAGES.NETWORK);
  }

  // その他のエラー
  console.error("Error fetching chatbot response:", error);
  throw error;
}
