/**
 * Web検索関連のユーティリティ関数
 *
 * このファイルはDuckDuckGoを使用したWeb検索機能を提供します。
 * 検索キーワードの抽出や検索結果の処理を行います。
 */

import OpenAI from "openai";
import { search, SafeSearchType } from "duck-duck-scrape";

// OpenAIのクライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 * Web検索を実行する関数
 * 質問に対する最新情報を取得するためにDuckDuckGoでWeb検索を行います
 *
 * @param query 検索クエリ
 * @param limit 返却する検索結果の最大数
 * @returns 検索結果のリスト
 */
export async function performWebSearch(
  query: string,
  limit: number = 3
): Promise<SearchResult[]> {
  try {
    console.log(`サーバー側で直接Web検索を実行: "${query}"`);

    const options = {
      safeSearch: SafeSearchType.MODERATE,
      locale: "ja-jp",
    };

    const searchResults = await search(query, options);
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

    throw new Error("DuckDuckGoで検索結果が見つかりませんでした");
  } catch (error) {
    console.error("Web検索エラー:", error);
    throw new Error("検索中にエラーが発生しました");
  }
}

/**
 * 検索キーワードを抽出する関数
 * ユーザーの質問から効果的な検索キーワードをAI生成します
 *
 * @param prompt ユーザーの質問
 * @returns 抽出されたキーワード
 */
export async function extractSearchKeywords(prompt: string): Promise<string> {
  const keywordExtractionPrompt = `次の質問からWeb検索に使用する重要なキーワードを3〜5つ抽出してください。キーワードのみをカンマ区切りで出力してください。\n\n質問: ${prompt}`;

  const keywordResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user" as const, content: keywordExtractionPrompt }],
    max_tokens: 100,
    temperature: 0.3,
  });

  return keywordResponse.choices[0]?.message?.content?.trim() || prompt;
}
