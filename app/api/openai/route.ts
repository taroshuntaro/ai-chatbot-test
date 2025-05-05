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
 * 6. テストモードでの疑似応答生成（OpenAI API接続なし）
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
 * レート制限の設定値
 */
const RATE_LIMIT_SETTINGS = {
  INTERVAL_MS: 60 * 1000, // 1分間隔
  MAX_UNIQUE_TOKENS: 50, // 1分間に許可する固有のIPアドレス数
  MAX_REQUESTS_PER_INTERVAL: 5, // 1分間に許可するリクエスト数
};

/**
 * APIリクエストのタイムアウト時間（ミリ秒）
 */
const API_TIMEOUT_MS = 25000; // 25秒

/**
 * APIレスポンスのステータスコード
 */
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  GATEWAY_TIMEOUT: 504,
};

/**
 * エラーメッセージの定数
 */
const ERROR_MESSAGES = {
  RATE_LIMIT: "Rate limit exceeded. Please try again later.",
  INVALID_PROMPT: "Prompt is required and must be a string",
  TIMEOUT: "Request timed out",
  GENERAL: "Failed to fetch response from OpenAI",
};

/**
 * レート制限の設定
 * DoS攻撃やコスト制御のために、クライアントごとの最大リクエスト数を制限します
 */
const limiter = rateLimit({
  interval: RATE_LIMIT_SETTINGS.INTERVAL_MS,
  uniqueTokenPerInterval: RATE_LIMIT_SETTINGS.MAX_UNIQUE_TOKENS,
});

/**
 * テストモードの応答パターンを定義
 * 複数のパターンからランダムに選択して多様な応答を生成します
 */
const TEST_RESPONSES = [
  (prompt: string, date: string) =>
    `## テストモードでの応答\n\nこれはAPIを使用せずに生成された応答です。\n\nあなたの質問: "${prompt}"\n\n現在の時刻: ${date}\n\n> これはテスト用の引用です\n\n\`\`\`javascript\n// これはテスト用のコードブロックです\nconsole.log("Hello, World!");\n\`\`\``,

  (prompt: string, date: string) =>
    `# テスト応答\n\nこんにちは！これはテストモードでの応答です。\n\n**ご質問**: ${prompt}\n\n実際のAPIは呼び出されていません。テスト環境での動作確認に役立ちます。\n\n1. テストポイント1\n2. テストポイント2\n3. テストポイント3\n\n応答生成時刻: ${date}`,

  (prompt: string, date: string) =>
    `### 自動生成されたテスト応答\n\n${prompt}についてのお問い合わせありがとうございます。\n\nこれはテストモードでの応答のため、実際のデータや情報は含まれていません。\n\n- 項目1\n- 項目2\n- 項目3\n\nテストモードは開発時の動作確認に最適です。\n\n生成時刻: ${date}`,

  (prompt: string, date: string) =>
    `## テストモード有効\n\n**入力**: ${prompt}\n\n**応答**: これはテスト用の自動生成メッセージです。API呼び出しは行われていません。\n\n表形式のサンプル:\n\n| 項目 | 説明 |\n|------|------|\n| テスト1 | サンプル説明1 |\n| テスト2 | サンプル説明2 |\n\n処理時刻: ${date}`,
];

/**
 * テストモードでの応答を生成する関数
 *
 * テスト用モデルが選択されている場合に
 * APIを呼び出さずに疑似的な応答を生成します
 *
 * @param prompt ユーザーの入力
 * @returns 疑似的な応答オブジェクト
 */
async function generateTestResponse(prompt: string): Promise<{
  text: string;
  html: string;
  isMarkdown: boolean;
}> {
  console.log("テストモード: OpenAI APIは呼び出されません");

  // 現在日時を取得してテスト応答に含める
  const currentDate = new Date().toLocaleString("ja-JP");

  // ランダムに応答パターンを選択
  const randomIndex = Math.floor(Math.random() * TEST_RESPONSES.length);
  const responseText = TEST_RESPONSES[randomIndex](prompt, currentDate);

  // マークダウンをHTMLに変換
  const htmlContent = await marked(responseText);

  return {
    text: responseText,
    html: htmlContent,
    isMarkdown: true,
  };
}

/**
 * レート制限をチェックする関数
 *
 * @param ipAddress クライアントのIPアドレス
 * @throws レート制限超過時にエラーをスロー
 */
async function checkRateLimit(ipAddress: string): Promise<void> {
  try {
    await limiter.check(
      RATE_LIMIT_SETTINGS.MAX_REQUESTS_PER_INTERVAL,
      ipAddress
    );
  } catch (error) {
    throw new Error(ERROR_MESSAGES.RATE_LIMIT);
  }
}

/**
 * 入力パラメータを検証する関数
 *
 * @param prompt ユーザーの入力テキスト
 * @param model 選択されたモデル
 * @returns 検証されたモデル
 * @throws 入力が無効な場合エラーをスロー
 */
function validateInput(prompt: unknown, model: unknown): OpenAIModel {
  // 入力の検証
  if (!prompt || typeof prompt !== "string") {
    throw new Error(ERROR_MESSAGES.INVALID_PROMPT);
  }

  // モデルの検証（有効なモデルが指定されていない場合はデフォルトを使用）
  return model && AVAILABLE_MODELS.includes(model as OpenAIModel)
    ? (model as OpenAIModel)
    : DEFAULT_MODEL;
}

/**
 * 応答を生成する関数
 *
 * @param sanitizedPrompt サニタイズされた入力
 * @param selectedModel 選択されたモデル
 * @returns 生成された応答
 */
async function generateApiResponse(
  sanitizedPrompt: string,
  selectedModel: OpenAIModel
): Promise<{ text: string; html: string; isMarkdown: boolean }> {
  // タイムアウト設定
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    // Web検索ユーティリティに現在のモデルを設定
    const { setCurrentModel } = await import("@/app/utils/openai/webSearch");
    setCurrentModel(selectedModel);

    // 初期応答を生成
    console.log(`[DEBUG] 初期応答生成開始: モデル=${selectedModel}`);
    const initialResponse = await generateInitialResponse(
      sanitizedPrompt,
      controller.signal,
      selectedModel
    );
    console.log("[DEBUG] 初期応答生成完了");

    // パターンマッチングに基づいてWeb検索の必要性を判断
    let finalContent = initialResponse;

    // パターンマッチングによる検索判断
    if (needsWebSearchInfo(initialResponse)) {
      console.log(
        "[INFO] パターンマッチングにより、Web検索による情報の補完が必要と判断されました"
      );
      finalContent = await generateResponseWithWebSearch(
        sanitizedPrompt,
        initialResponse,
        selectedModel
      );
    }

    // Markdownをリッチテキスト(HTML)に変換
    const htmlContent = await marked(finalContent);

    return {
      text: finalContent,
      html: htmlContent,
      isMarkdown: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * POSTリクエストハンドラ
 *
 * クライアントからのリクエストを処理し、AI応答を返します。
 * 主な処理フロー：
 * 1. レート制限の確認
 * 2. 入力の検証とサニタイズ
 * 3. テストモードの場合は疑似応答を生成（OpenAI API接続なし）
 * 4. 通常モードの場合はOpenAI APIで応答を生成
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
      await checkRateLimit(ip);
    } catch (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT },
        { status: HTTP_STATUS.TOO_MANY_REQUESTS }
      );
    }

    // リクエストボディをパース
    const body = await req.json();
    const { prompt, model } = body;

    // デバッグ情報: 受信したリクエストの情報をログ出力
    console.log(
      `[DEBUG] 受信したリクエスト: prompt=${prompt?.substring(
        0,
        30
      )}... model=${model}`
    );

    try {
      // 入力の検証
      const selectedModel = validateInput(prompt, model);

      // デバッグ情報: 選択されたモデルをログ出力
      console.log(
        `[DEBUG] 選択されたモデル: ${selectedModel}, テストモード=${
          selectedModel === "test-model"
        }`
      );
      console.log(`[DEBUG] 有効なモデル一覧: ${AVAILABLE_MODELS.join(", ")}`);

      // テストモデルの場合はサーバー側でテスト応答を生成（OpenAI API接続なし）
      if (selectedModel === "test-model") {
        console.log(
          "[INFO] テストモデルが選択されました: OpenAI APIは使用されません"
        );
        const testResponse = await generateTestResponse(prompt);
        return NextResponse.json(testResponse);
      }

      // 通常モードの処理（以下はOpenAI APIを使用）
      console.log(`[INFO] 通常モードで処理: モデル=${selectedModel}`);

      // 入力のサニタイズ
      const sanitizedPrompt = sanitizeInput(prompt);

      // 応答生成
      const responseData = await generateApiResponse(
        sanitizedPrompt,
        selectedModel
      );

      return NextResponse.json(responseData);
    } catch (error: any) {
      // 入力検証エラーの場合
      if (error.message === ERROR_MESSAGES.INVALID_PROMPT) {
        return NextResponse.json(
          { error: error.message },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      // その他のエラーを再スロー
      throw error;
    }
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error);

    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: ERROR_MESSAGES.TIMEOUT },
        { status: HTTP_STATUS.GATEWAY_TIMEOUT }
      );
    }

    const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL, details: error.message },
      { status }
    );
  }
}
