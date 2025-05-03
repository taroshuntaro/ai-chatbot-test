/**
 * OpenAI API通信に関するユーティリティ関数
 *
 * このファイルは、OpenAI APIを使用して応答を生成するための
 * 機能を提供します。初期応答生成とWeb検索補完機能を含みます。
 * テストモード対応（OpenAI API接続なし）も実装しています。
 *
 * @module apiUtils
 */

import OpenAI from "openai";
import { extractSearchKeywords, performWebSearch } from "./webSearch";
import { OpenAIModel, DEFAULT_MODEL } from "@/types/model";

// OpenAIのクライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * API設定関連の定数
 */
const API_SETTINGS = {
  /**
   * 入力の最大文字数
   */
  MAX_INPUT_LENGTH: 1000,

  /**
   * 応答の最大トークン数
   */
  MAX_TOKENS: 1000,

  /**
   * モデルの温度パラメータ
   */
  TEMPERATURE: 0.7,

  /**
   * 検索結果の最大取得数
   */
  MAX_SEARCH_RESULTS: 3,
};

/**
 * ログメッセージの定数
 */
const LOG_MESSAGES = {
  TEST_MODE_DETECTED:
    "[WARN] apiUtils: テストモードが検出されました。OpenAI APIは呼び出されません。",
  INITIAL_RESPONSE_CALLED: (model: string) =>
    `[DEBUG] generateInitialResponse called with model=${model}`,
  CALLING_API: (model: string) =>
    `[INFO] OpenAI APIを呼び出します: モデル=${model}`,
  API_CALL_SUCCESS: "[DEBUG] OpenAI API呼び出し成功",
  API_CALL_FAILED: "[ERROR] OpenAI API呼び出し失敗:",
  SEARCH_RESPONSE_CALLED: (model: string) =>
    `[DEBUG] generateResponseWithWebSearch called with model=${model}`,
  SEARCH_KEYWORDS: (keywords: string) => `[DEBUG] 検索キーワード: ${keywords}`,
  NO_SEARCH_RESULTS: "[INFO] 検索結果が見つかりませんでした",
  CALLING_API_WITH_SEARCH: (model: string) =>
    `[INFO] 検索結果を含めてOpenAI APIを呼び出します: モデル=${model}`,
  API_SEARCH_CALL_SUCCESS: "[DEBUG] OpenAI API（Web検索あり）呼び出し成功",
  API_SEARCH_CALL_FAILED: "[ERROR] OpenAI API（Web検索あり）呼び出し失敗:",
  AUGMENTATION_ERROR: "[ERROR] 情報補完中にエラーが発生しました:",
  TEST_MODE_CHECK: (model: string, result: boolean) =>
    `[DEBUG] isTestMode: model=${model}, result=${result}`,
};

/**
 * システムプロンプトの定義
 */
const SYSTEM_PROMPTS = {
  INITIAL_RESPONSE:
    "あなたは親切なアシスタントです。質問に対して最新の情報がない場合は、明確にその旨を伝えてください。「私の知識は〇〇までです」などと正直に答えてください。",
  WEB_SEARCH:
    "あなたは親切なアシスタントです。提供された最新のWeb検索結果を参考にして、ユーザーの質問に回答してください。検索結果を適切に引用し、ソースを明示してください。",
};

/**
 * テスト関連の定数
 */
const TEST_RESPONSES = {
  INITIAL: "これはテストモードでの応答です。実際のAPIは呼び出されていません。",
  WEB_SEARCH: (prompt: string, initialResponse: string) =>
    `これはテストモードでの応答です。Web検索機能も実際には実行されていません。
初期クエリ: ${prompt}
初期応答: ${initialResponse}`,
};

/**
 * テストモード用のモデル識別子
 * 定数として定義することで一貫性を保証し、タイプミスを防ぐ
 */
export const TEST_MODEL_ID = "test-model";

/**
 * 入力のサニタイズ
 * セキュリティリスクを軽減するために入力を制限します
 *
 * @param input ユーザー入力
 * @returns サニタイズされた入力
 */
export function sanitizeInput(input: string): string {
  return input.slice(0, API_SETTINGS.MAX_INPUT_LENGTH);
}

/**
 * テストモードかどうかを判定する関数
 *
 * @param model 使用するLLMモデル
 * @returns テストモードの場合はtrue、そうでない場合はfalse
 */
export function isTestMode(model: OpenAIModel): boolean {
  const isTest = model === TEST_MODEL_ID;
  // デバッグ情報: テストモード判定結果をログ出力
  console.log(LOG_MESSAGES.TEST_MODE_CHECK(model, isTest));
  return isTest;
}

/**
 * OpenAI APIを呼び出す関数
 *
 * @param model 使用するモデル
 * @param messages メッセージ配列
 * @param signal アボートシグナル
 * @returns APIレスポンス
 */
async function callOpenAI(
  model: OpenAIModel,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  signal?: AbortSignal
) {
  try {
    const response = await openai.chat.completions.create(
      {
        model: model,
        messages: messages,
        max_tokens: API_SETTINGS.MAX_TOKENS,
        temperature: API_SETTINGS.TEMPERATURE,
      },
      signal ? { signal } : undefined
    );
    console.log(LOG_MESSAGES.API_CALL_SUCCESS);
    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error(LOG_MESSAGES.API_CALL_FAILED, error);
    throw error;
  }
}

/**
 * 初期応答を生成する関数
 *
 * ユーザーの質問に対する最初のAI応答を生成します。
 * システムプロンプトでは、AIに最新情報がない場合は正直に伝えるよう指示しています。
 * テストモードの場合はOpenAI APIを呼び出さず、テスト用のメッセージを返します。
 *
 * @param prompt ユーザーの質問
 * @param signal アボートシグナル（タイムアウト用）
 * @param model 使用するLLMモデル
 * @returns AIの初期応答
 */
export async function generateInitialResponse(
  prompt: string,
  signal: AbortSignal,
  model: OpenAIModel = DEFAULT_MODEL
): Promise<string> {
  console.log(LOG_MESSAGES.INITIAL_RESPONSE_CALLED(model));

  // テストモードの場合はOpenAI APIを呼び出さない
  if (isTestMode(model)) {
    console.warn(LOG_MESSAGES.TEST_MODE_DETECTED);
    return TEST_RESPONSES.INITIAL;
  }

  console.log(LOG_MESSAGES.CALLING_API(model));
  const messages = [
    {
      role: "system" as const,
      content: SYSTEM_PROMPTS.INITIAL_RESPONSE,
    },
    { role: "user" as const, content: prompt },
  ];

  return callOpenAI(model, messages, signal);
}

/**
 * 検索結果をフォーマットする関数
 *
 * @param searchResults 検索結果配列
 * @returns フォーマットされた検索結果テキスト
 */
function formatSearchResults(
  searchResults: Array<{ title: string; url: string; description: string }>
) {
  let searchContext = "以下は最新のWeb検索結果です:\n\n";

  searchResults.forEach((result, index) => {
    searchContext += `[${index + 1}] ${result.title}\n`;
    searchContext += `URL: ${result.url}\n`;
    searchContext += `${result.description}\n\n`;
  });

  return searchContext;
}

/**
 * Web検索結果を使った回答生成
 *
 * AIの初期応答に最新情報が不足している場合、Web検索結果を用いて
 * 情報を補完した新たな回答を生成します。
 * テストモードの場合はOpenAI APIを呼び出さず、テスト用のメッセージを返します。
 *
 * @param prompt ユーザーの質問
 * @param initialResponse AIの初期応答
 * @param model 使用するLLMモデル
 * @returns Web検索結果で補完された応答
 */
export async function generateResponseWithWebSearch(
  prompt: string,
  initialResponse: string,
  model: OpenAIModel = DEFAULT_MODEL
): Promise<string> {
  console.log(LOG_MESSAGES.SEARCH_RESPONSE_CALLED(model));

  // テストモードの場合はOpenAI APIを呼び出さない
  if (isTestMode(model)) {
    console.warn(LOG_MESSAGES.TEST_MODE_DETECTED);
    return TEST_RESPONSES.WEB_SEARCH(prompt, initialResponse);
  }

  try {
    // 検索キーワード抽出
    const searchKeywords = await extractSearchKeywords(prompt);
    console.log(LOG_MESSAGES.SEARCH_KEYWORDS(searchKeywords));

    // Web検索実行
    const searchResults = await performWebSearch(
      searchKeywords,
      API_SETTINGS.MAX_SEARCH_RESULTS
    );

    // 検索結果が空の場合は元の回答を返す
    if (!searchResults || searchResults.length === 0) {
      console.log(LOG_MESSAGES.NO_SEARCH_RESULTS);
      return initialResponse;
    }

    // 検索結果をフォーマット
    const searchContext = formatSearchResults(searchResults);

    // 検索結果を含めて再度OpenAI APIを呼び出し
    console.log(LOG_MESSAGES.CALLING_API_WITH_SEARCH(model));

    return await generateFinalResponseWithSearchResults(
      prompt,
      initialResponse,
      searchContext,
      model
    );
  } catch (error) {
    console.error(LOG_MESSAGES.AUGMENTATION_ERROR, error);
    return initialResponse; // エラーが発生した場合は元の応答を返す
  }
}

/**
 * 検索結果を含めた最終応答を生成する関数
 *
 * @param prompt ユーザーの質問
 * @param initialResponse 初期応答
 * @param searchContext フォーマット済み検索結果
 * @param model 使用するモデル
 * @returns 最終応答
 */
async function generateFinalResponseWithSearchResults(
  prompt: string,
  initialResponse: string,
  searchContext: string,
  model: OpenAIModel
): Promise<string> {
  const finalMessages = [
    {
      role: "system" as const,
      content: SYSTEM_PROMPTS.WEB_SEARCH,
    },
    { role: "user" as const, content: prompt },
    {
      role: "assistant" as const,
      content:
        "申し訳ありませんが、その質問に答えるための最新情報を持っていません。Web検索で確認してみます。",
    },
    {
      role: "user" as const,
      content:
        searchContext +
        "\n\n上記の情報を参考に、私の質問に回答してください: " +
        prompt,
    },
  ];

  try {
    const finalResponse = await callOpenAI(model, finalMessages);
    console.log(LOG_MESSAGES.API_SEARCH_CALL_SUCCESS);
    return finalResponse || initialResponse;
  } catch (error) {
    console.error(LOG_MESSAGES.API_SEARCH_CALL_FAILED, error);
    return initialResponse; // エラーが発生した場合は元の応答を返す
  }
}
