/**
 * OpenAI API通信に関するユーティリティ関数
 *
 * このファイルは、OpenAI APIを使用して応答を生成するための
 * 機能を提供します。初期応答生成とWeb検索補完機能を含みます。
 */

import OpenAI from "openai";
import { extractSearchKeywords, performWebSearch } from "./webSearch";
import { OpenAIModel, DEFAULT_MODEL } from "@/types/model";

// OpenAIのクライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 入力のサニタイズ
 * セキュリティリスクを軽減するために入力を制限します
 *
 * @param input ユーザー入力
 * @returns サニタイズされた入力
 */
export function sanitizeInput(input: string): string {
  return input.slice(0, 1000); // 入力を1000文字に制限
}

/**
 * 初期応答を生成する関数
 *
 * ユーザーの質問に対する最初のAI応答を生成します。
 * システムプロンプトでは、AIに最新情報がない場合は正直に伝えるよう指示しています。
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
  const messages = [
    {
      role: "system" as const,
      content:
        "あなたは親切なアシスタントです。質問に対して最新の情報がない場合は、明確にその旨を伝えてください。「私の知識は〇〇までです」などと正直に答えてください。",
    },
    { role: "user" as const, content: prompt },
  ];

  const initialResponse = await openai.chat.completions.create(
    {
      model: model,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    },
    {
      signal: signal,
    }
  );

  return initialResponse.choices[0]?.message?.content?.trim() || "";
}

/**
 * Web検索結果を使った回答生成
 *
 * AIの初期応答に最新情報が不足している場合、Web検索結果を用いて
 * 情報を補完した新たな回答を生成します。
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
  try {
    // 検索キーワード抽出
    const searchKeywords = await extractSearchKeywords(prompt);
    console.log(`検索キーワード: ${searchKeywords}`);

    // Web検索実行
    const searchResults = await performWebSearch(searchKeywords, 3);

    // 検索結果が空の場合は元の回答を返す
    if (!searchResults || searchResults.length === 0) {
      console.log("検索結果が見つかりませんでした");
      return initialResponse;
    }

    // 検索結果をフォーマット
    let searchContext = "以下は最新のWeb検索結果です:\n\n";
    searchResults.forEach((result, index) => {
      searchContext += `[${index + 1}] ${result.title}\n`;
      searchContext += `URL: ${result.url}\n`;
      searchContext += `${result.description}\n\n`;
    });

    // 検索結果を含めて再度OpenAI APIを呼び出し
    const finalMessages = [
      {
        role: "system" as const,
        content:
          "あなたは親切なアシスタントです。提供された最新のWeb検索結果を参考にして、ユーザーの質問に回答してください。検索結果を適切に引用し、ソースを明示してください。",
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

    const finalResponse = await openai.chat.completions.create({
      model: model,
      messages: finalMessages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return (
      finalResponse.choices[0]?.message?.content?.trim() || initialResponse
    );
  } catch (error) {
    console.error("情報補完中にエラーが発生しました:", error);
    return initialResponse; // エラーが発生した場合は元の応答を返す
  }
}
