/**
 * Web検索関連のユーティリティ関数
 *
 * このファイルはDuckDuckGoを使用したWeb検索機能を提供します。
 * 検索キーワードの抽出や検索結果の処理を行います。
 * テストモードにも対応し、実際のAPIコールを回避します。
 *
 * @module webSearch
 */

import OpenAI from "openai";
import { search, SearchOptions, SafeSearchType } from "duck-duck-scrape";
import { OpenAIModel } from "@/types/model";
import { isTestMode } from "./apiUtils";

// OpenAIのクライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 検索関連の定数
 */
const SEARCH_CONSTANTS = {
  /**
   * 検索結果の最大数（デフォルト値）
   */
  DEFAULT_RESULT_LIMIT: 3,

  /**
   * キーワード抽出に使用するモデル
   * 軽量なモデルで十分なため、ユーザー選択モデルは使用しない
   */
  KEYWORD_EXTRACTION_MODEL: "gpt-4o-mini",

  /**
   * キーワード抽出のAI設定
   */
  KEYWORD_EXTRACTION_SETTINGS: {
    MAX_TOKENS: 100,
    TEMPERATURE: 0.3,
  },

  /**
   * 検索設定
   * SearchOptions型に適合させるため、小文字のキーを使用
   */
  SEARCH_OPTIONS: {
    safeSearch: SafeSearchType.MODERATE,
    locale: "ja-jp",
  } as SearchOptions,
};

/**
 * エラーメッセージ
 */
const ERROR_MESSAGES = {
  NO_RESULTS: "DuckDuckGoで検索結果が見つかりませんでした",
  SEARCH_ERROR: "検索中にエラーが発生しました",
  MODEL_NOT_SET:
    "モデルが設定されていません。テストモードと判定できないため、安全のためにダミー結果を返します。",
};

/**
 * ログメッセージ
 */
const LOG_MESSAGES = {
  SET_MODEL: (model: OpenAIModel, isTest: boolean) =>
    `[DEBUG] webSearch: 現在のモデルを設定: ${model}, テストモード=${isTest}`,
  TEST_MODE_SEARCH: (query: string) =>
    `[INFO] webSearch: テストモードのためダミー検索結果を返します。検索クエリ: "${query}"`,
  DIRECT_SEARCH: (query: string) =>
    `[INFO] サーバー側で直接Web検索を実行: "${query}"`,
  TEST_MODE_KEYWORDS: (prompt: string) =>
    `[INFO] webSearch: テストモードのためダミーキーワードを返します。プロンプト: "${prompt.substring(
      0,
      30
    )}..."`,
  KEYWORD_EXTRACTION: (prompt: string) =>
    `[INFO] OpenAI APIを使用してキーワード抽出: "${prompt.substring(
      0,
      30
    )}..." (使用モデル: ${SEARCH_CONSTANTS.KEYWORD_EXTRACTION_MODEL})`,
  KEYWORD_SUCCESS: "[DEBUG] キーワード抽出成功",
};

/**
 * SearchResult型の定義
 * Web検索結果のデータ構造を定義します
 */
export type SearchResult = {
  title: string;
  url: string;
  description: string;
};

/**
 * 現在のAPIモデルを保持するグローバル変数
 * テストモード判定に使用します
 * 初期値はnullとし、必ず設定してから使用するようにします
 */
let currentModel: OpenAIModel | null = null;

/**
 * 現在使用中のモデルを設定する関数
 * 他のユーティリティ関数からテストモードを判定するために使用
 *
 * @param model 使用するLLMモデル
 */
export function setCurrentModel(model: OpenAIModel) {
  currentModel = model;
  console.log(LOG_MESSAGES.SET_MODEL(model, isTestMode(model)));
}

/**
 * モデル設定状態をチェックする関数
 * モデルが設定されていない場合に警告ログを出力
 *
 * @returns モデルが設定されていなければfalse
 */
function checkModelSet(): boolean {
  if (currentModel === null) {
    console.warn(`[WARN] ${ERROR_MESSAGES.MODEL_NOT_SET}`);
    return false;
  }
  return true;
}

/**
 * Web検索を実行する関数
 * 質問に対する最新情報を取得するためにDuckDuckGoでWeb検索を行います
 * テストモードの場合はダミーの検索結果を返します
 *
 * @param query 検索クエリ
 * @param limit 返却する検索結果の最大数
 * @returns 検索結果のリスト
 */
export async function performWebSearch(
  query: string,
  limit: number = SEARCH_CONSTANTS.DEFAULT_RESULT_LIMIT
): Promise<SearchResult[]> {
  // モデル設定チェック
  if (!checkModelSet()) {
    return generateDummySearchResults(query, limit);
  }

  // テストモードチェック
  if (isTestMode(currentModel!)) {
    console.log(LOG_MESSAGES.TEST_MODE_SEARCH(query));
    return generateDummySearchResults(query, limit);
  }

  try {
    console.log(LOG_MESSAGES.DIRECT_SEARCH(query));

    const searchResults = await search(query, SEARCH_CONSTANTS.SEARCH_OPTIONS);

    return formatSearchResults(searchResults, limit);
  } catch (error) {
    console.error("[ERROR] Web検索エラー:", error);
    throw new Error(ERROR_MESSAGES.SEARCH_ERROR);
  }
}

/**
 * 検索結果をフォーマットする関数
 *
 * @param searchResults 検索API結果
 * @param limit 結果の最大数
 * @returns フォーマットされた検索結果
 */
function formatSearchResults(
  searchResults: any,
  limit: number
): SearchResult[] {
  const formattedResults: SearchResult[] = [];

  if (searchResults && !searchResults.noResults && searchResults.results) {
    for (const result of searchResults.results) {
      if (formattedResults.length >= limit) break;

      formattedResults.push({
        title: result.title || "",
        url: result.url || "",
        description: result.description || "",
      });
    }
  }

  if (formattedResults.length > 0) {
    return formattedResults;
  }

  throw new Error(ERROR_MESSAGES.NO_RESULTS);
}

/**
 * テストモード用のダミー検索結果を生成する関数
 *
 * @param query 検索クエリ
 * @param limit 返却する検索結果の最大数
 * @returns ダミーの検索結果
 */
function generateDummySearchResults(
  query: string,
  limit: number
): SearchResult[] {
  const currentDate = new Date().toLocaleString("ja-JP");

  const dummyResults: SearchResult[] = [
    {
      title: `テスト検索結果1 - ${query}の解説`,
      url: "https://example.com/test-result-1",
      description: `これはテストモードで生成されたダミーの検索結果です。実際のWeb検索は行われていません。検索クエリ: "${query}", 生成時刻: ${currentDate}`,
    },
    {
      title: `${query}に関する最新情報（テスト）`,
      url: "https://example.com/test-result-2",
      description:
        "これはテストモードのダミー検索結果です。実際のWebコンテンツは含まれていません。",
    },
    {
      title: `${query}の使い方ガイド - テスト検索結果`,
      url: "https://example.com/test-result-3",
      description:
        "テストモードで生成された3つ目のダミー検索結果です。このデータは固定で、実際のWeb検索結果ではありません。",
    },
    {
      title: `テスト結果4: ${query}のよくある質問`,
      url: "https://example.com/test-result-4",
      description:
        "これは4つ目のテスト用ダミー検索結果です。実際の検索エンジンは使用されていません。",
    },
  ];

  // 指定された上限数まで結果を返す
  return dummyResults.slice(0, Math.min(limit, dummyResults.length));
}

/**
 * プロンプトから簡易的にキーワードを抽出する関数
 * テストモードやモデル未設定時に使用
 *
 * @param prompt 元のプロンプト
 * @param fallbackValue 抽出失敗時のフォールバック値
 * @returns 抽出されたキーワード
 */
function extractKeywordsFromText(
  prompt: string,
  fallbackValue: string
): string {
  const words = prompt.split(/\s+/);
  const keywords = words
    .filter((word) => word.length > 2) // 短すぎる単語を除外
    .slice(0, 5) // 最大5単語
    .join(", ");

  return keywords || fallbackValue;
}

/**
 * 検索キーワードを抽出する関数
 * ユーザーの質問から効果的な検索キーワードをAI生成します
 * テストモードの場合はAPIを呼び出さずダミーのキーワードを返します
 *
 * @param prompt ユーザーの質問
 * @returns 抽出されたキーワード
 */
export async function extractSearchKeywords(prompt: string): Promise<string> {
  // モデル設定チェック
  if (!checkModelSet()) {
    // プロンプトから簡易的にキーワードを抽出（モデル未設定時の安全策）
    return extractKeywordsFromText(prompt, "安全策, キーワード, 抽出");
  }

  // テストモードチェック
  if (isTestMode(currentModel!)) {
    console.log(LOG_MESSAGES.TEST_MODE_KEYWORDS(prompt));
    // プロンプトから簡易的にキーワードを抽出（テスト用）
    return extractKeywordsFromText(prompt, "テスト, キーワード, 抽出");
  }

  console.log(LOG_MESSAGES.KEYWORD_EXTRACTION(prompt));

  return await generateKeywordsWithAI(prompt);
}

/**
 * AI（OpenAI）を使用してキーワードを生成する関数
 *
 * @param prompt ユーザーの質問
 * @returns 生成されたキーワード
 */
async function generateKeywordsWithAI(prompt: string): Promise<string> {
  const keywordExtractionPrompt = `次の質問からWeb検索に使用する重要なキーワードを3〜5つ抽出してください。キーワードのみをカンマ区切りで出力してください。\n\n質問: ${prompt}`;

  try {
    const keywordResponse = await openai.chat.completions.create({
      model: SEARCH_CONSTANTS.KEYWORD_EXTRACTION_MODEL,
      messages: [{ role: "user" as const, content: keywordExtractionPrompt }],
      max_tokens: SEARCH_CONSTANTS.KEYWORD_EXTRACTION_SETTINGS.MAX_TOKENS,
      temperature: SEARCH_CONSTANTS.KEYWORD_EXTRACTION_SETTINGS.TEMPERATURE,
    });

    console.log(LOG_MESSAGES.KEYWORD_SUCCESS);
    return keywordResponse.choices[0]?.message?.content?.trim() || prompt;
  } catch (error) {
    console.error("[ERROR] キーワード抽出中にエラーが発生:", error);
    // エラー時は元のプロンプトをそのまま返す
    return prompt;
  }
}
