/**
 * OpenAI APIによるチャットボット応答生成ルート
 *
 * このファイルは、ユーザーのプロンプトを受け取り、OpenAI APIを使用して応答を生成する
 * サーバーサイドの処理を実装しています。主な機能は以下の通りです:
 *
 * 1. レート制限による過剰リクエストの防止
 * 2. WebSearch機能による最新情報の補完
 * 3. エラーハンドリングとタイムアウト処理
 * 4. Markdownフォーマットによるリッチテキスト応答
 * 5. 複数のLLMモデル選択のサポート
 *
 * @module api/openai
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { marked } from "marked";
import { rateLimit } from "@/app/utils/rateLimit";
import { needsWebSearchInfo } from "@/app/utils/openai/searchAnalyzer";
import {
  sanitizeInput,
  generateInitialResponse,
  generateResponseWithWebSearch,
} from "@/app/utils/openai/apiUtils";
import { OpenAIModel, DEFAULT_MODEL, AVAILABLE_MODELS } from "@/types/model";

// OpenAIのクライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * レート制限の設定
 * DoS攻撃やコスト制御のために、クライアントごとの最大リクエスト数を制限します
 */
const limiter = rateLimit({
  interval: 60 * 1000, // 1分間隔
  uniqueTokenPerInterval: 50, // 1分間に許可する固有のIPアドレス数
});

/**
 * POSTリクエストハンドラ
 *
 * クライアントからのリクエストを処理し、AI応答を返します。
 * 主な処理フロー：
 * 1. レート制限の確認
 * 2. 入力の検証とサニタイズ
 * 3. 初期応答の生成
 * 4. 必要に応じたWeb検索による情報補完
 * 5. 応答のマークダウン変換とレスポンス返却
 *
 * エラーハンドリングとタイムアウト処理も実装しています。
 *
 * @param req クライアントからのリクエスト
 * @returns JSON形式のレスポンス
 */
export async function POST(req: Request) {
  try {
    // クライアントのIPアドレスを取得
    const ip = req.headers.get("x-forwarded-for") || "anonymous";

    // レート制限を適用
    try {
      await limiter.check(5, ip); // 1分間に5リクエストまで
    } catch (error) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // リクエストボディをパース
    const body = await req.json();
    const { prompt, model } = body;

    // 入力の検証
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    // モデルの検証（有効なモデルが指定されていない場合はデフォルトを使用）
    const selectedModel: OpenAIModel =
      model && AVAILABLE_MODELS.includes(model as OpenAIModel)
        ? (model as OpenAIModel)
        : DEFAULT_MODEL;

    // 入力のサニタイズ
    const sanitizedPrompt = sanitizeInput(prompt);

    // タイムアウト設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25秒でタイムアウト

    try {
      // 初期応答を生成
      const responseContent = await generateInitialResponse(
        sanitizedPrompt,
        controller.signal,
        selectedModel
      );

      // Web検索が必要かチェック
      let finalResponse = responseContent;
      if (needsWebSearchInfo(responseContent)) {
        console.log("Web検索による情報の補完が必要と判断されました");
        finalResponse = await generateResponseWithWebSearch(
          sanitizedPrompt,
          responseContent,
          selectedModel
        );
      }

      clearTimeout(timeoutId);

      // Markdownをリッチテキスト(HTML)に変換
      const htmlContent = marked(finalResponse);

      return NextResponse.json({
        text: finalResponse,
        html: htmlContent,
        isMarkdown: true,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error);

    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }

    const status = error.status || 500;
    return NextResponse.json(
      { error: "Failed to fetch response from OpenAI", details: error.message },
      { status }
    );
  }
}
