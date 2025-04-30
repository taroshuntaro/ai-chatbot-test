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
 * バックエンドのOpenAI APIエンドポイントを呼び出してチャットボットの応答を取得する
 *
 * この関数は、ユーザーの入力を適切にサニタイズし、サーバーサイドのAPIに送信します。
 * また、様々なエラーケース（タイムアウト、レート制限、ネットワークエラーなど）を処理し、
 * ユーザーフレンドリーなエラーメッセージを提供します。
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
    // 入力値の検証
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("入力が必要です");
    }

    // 入力のサニタイズ（サーバー側の制限に合わせて1000文字に制限）
    const sanitizedPrompt = prompt.trim().slice(0, 1000);

    // サーバーへのリクエスト送信
    const response = await fetch("/api/openai", {
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

    // エラーレスポンスの処理
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || "バックエンドからの応答の取得に失敗しました";

      // 特定のエラーコードに対する詳細なメッセージ
      if (response.status === 429) {
        throw new Error(
          "リクエスト回数の制限を超えました。しばらく待ってからお試しください。"
        );
      } else if (response.status === 504) {
        throw new Error(
          "リクエストがタイムアウトしました。もう一度お試しください。"
        );
      }

      throw new Error(errorMessage);
    }

    // レスポンスデータの解析
    const data = await response.json();

    // レスポンスデータの検証
    if (!data || typeof data.text !== "string") {
      throw new Error("無効なレスポンス形式です");
    }

    // 正常なレスポンスを返却
    return {
      text: data.text || "",
      html: data.html || undefined,
      isMarkdown: data.isMarkdown || false,
    };
  } catch (error: any) {
    // タイムアウトエラーの処理
    if (error.name === "AbortError") {
      console.error("Request was aborted", error);
      throw new Error(
        "リクエストがタイムアウトしました。もう一度お試しください。"
      );
    }

    // ネットワークエラーの処理
    if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      console.error("Network error:", error);
      throw new Error(
        "ネットワークエラーが発生しました。接続を確認してください。"
      );
    }

    // その他のエラー
    console.error("Error fetching chatbot response:", error);
    throw error;
  }
}
