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
 *
 * @module api/openai
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { marked } from "marked";
import { rateLimit } from "@/app/utils/rateLimit";
import { search, SafeSearchType } from "duck-duck-scrape";

// OpenAIのクライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * SearchResult型の定義
 * Web検索結果のデータ構造を定義します
 */
type SearchResult = {
  title: string;
  url: string;
  description: string;
};

/**
 * レート制限の設定
 * DoS攻撃やコスト制御のために、クライアントごとの最大リクエスト数を制限します
 */
const limiter = rateLimit({
  interval: 60 * 1000, // 1分間隔
  uniqueTokenPerInterval: 50, // 1分間に許可する固有のIPアドレス数
});

/**
 * 入力のサニタイズ
 * セキュリティリスクを軽減するために入力を制限します
 *
 * @param input ユーザー入力
 * @returns サニタイズされた入力
 */
function sanitizeInput(input: string): string {
  return input.slice(0, 1000); // 入力を1000文字に制限
}

/**
 * Web検索を実行する関数
 * 質問に対する最新情報を取得するためにDuckDuckGoでWeb検索を行います
 *
 * @param query 検索クエリ
 * @param limit 返却する検索結果の最大数
 * @returns 検索結果のリスト
 */
async function performWebSearch(
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
async function extractSearchKeywords(prompt: string): Promise<string> {
  const keywordExtractionPrompt = `次の質問からWeb検索に使用する重要なキーワードを3〜5つ抽出してください。キーワードのみをカンマ区切りで出力してください。\n\n質問: ${prompt}`;

  const keywordResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user" as const, content: keywordExtractionPrompt }],
    max_tokens: 100,
    temperature: 0.3,
  });

  return keywordResponse.choices[0]?.message?.content?.trim() || prompt;
}

/**
 * テキスト内に「情報がない」や「最新の情報がない」などの表現がないかチェックする高精度な判定
 *
 * AIモデルの回答を解析し、Web検索による情報補完が必要かどうかを判断します。
 * AIモデルは訓練データの制限があるため、現在や最新の情報が必要な質問に対しては
 * 補完情報が必要となります。
 *
 * @param text AIの初期応答
 * @returns Web検索が必要かどうか
 */
function needsWebSearchInfo(text: string): boolean {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 強いパターン（検索が必要な強い指標）
  const strongPatterns = [
    /私の(知識|情報|データ)(は|が|では)(.{0,10})(まで|更新|制限)/i,
    /私が(持っている|アクセスできる)(情報|データ|知識)(は|が)(.{0,10})(まで|古い|限られて)/i,
    /(\d{4})年(.*?)までの(情報|データ)/i,
    /最新の(情報|データ|アップデート)(が|は)(ない|あり(ません|ません|ません|ません))/i,
    /現時点での正確な(情報|データ)(は|が)(わから|把握|確認でき)/i,
    /私の(トレーニング|学習)(データ|期間)(は|が)(.{0,15})(まで|終了|制限)/i,
    new RegExp(`${currentYear - 1}年(以前|まで)の(情報|データ)`, "i"),
    new RegExp(`${currentYear - 2}年(以前|まで)の(情報|データ)`, "i"),
  ];

  // 中程度のパターン
  const moderatePatterns = [
    /最新の(状況|バージョン|リリース|製品|技術)/i,
    new RegExp(`${currentYear}年(の|における)`, "i"),
    new RegExp(`${currentYear - 1}年以降`, "i"),
    /最近の(傾向|動向|発展|変化)/i,
    /(現在|今)の(市場|状況|標準|規格)/i,
    /正確な(情報|データ)を(得る|確認する)には/i,
    /公式(サイト|ウェブサイト|情報源)で(確認|参照)/i,
    /最新(情報|アップデート)は(.{0,20})(確認|参照)/i,
    /より詳細な(情報|データ)は(.{0,20})(検索|確認)/i,
  ];

  // 除外パターン（検索不要の指標）
  const exclusionPatterns = [
    /詳細な情報をお持ちしています/i,
    /最新のデータによると/i,
    /現在の情報では/i,
    /最新の研究では/i,
    /最近の調査によれば/i,
    /私の知識によれば/i,
    /詳しく説明します/i,
    /具体的な例を挙げると/i,
  ];

  // 年数に関する判定
  const yearMatch = text.match(/(\d{4})年/g);
  if (yearMatch) {
    const years = yearMatch.map((y) => parseInt(y.replace("年", ""), 10));
    const allYearsOld = years.every((y) => y < currentYear - 2);
    const hasFutureYears = years.some((y) => y > currentYear);

    if (allYearsOld && !hasFutureYears) {
      const hasRecentTerms = /最新|最近|現在|今の/.test(text);
      if (!hasRecentTerms) {
        return false;
      }
    }

    if (hasFutureYears) {
      return true;
    }
  }

  // 強いパターンが1つでもマッチすれば検索必要
  if (strongPatterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  // 除外パターンにマッチし、強いパターンにマッチしない場合は検索不要
  if (exclusionPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  // 中程度のパターンが2つ以上マッチすれば検索必要
  const moderateMatchCount = moderatePatterns.filter((pattern) =>
    pattern.test(text)
  ).length;
  if (moderateMatchCount >= 2) {
    return true;
  }

  // 短い回答は情報不足の可能性
  if (
    text.length < 100 &&
    /わかりません|不明|確認できません|把握していません/.test(text)
  ) {
    return true;
  }

  // 時間的コンテキスト判定
  const timeContextMatch = text.match(/(\d{4})年(現在|時点)/);
  if (timeContextMatch) {
    const mentionedYear = parseInt(timeContextMatch[1], 10);
    if (mentionedYear < currentYear - 1) {
      return true;
    }
  }

  // 月の判定
  const monthYearMatch = text.match(/(\d{4})年(\d{1,2})月/);
  if (monthYearMatch) {
    const mentionedYear = parseInt(monthYearMatch[1], 10);
    const mentionedMonth = parseInt(monthYearMatch[2], 10);

    if (
      mentionedYear < currentYear - 1 ||
      (mentionedYear === currentYear - 1 && mentionedMonth < currentMonth)
    ) {
      const historicalFactPattern =
        /(発売|設立|創業|創立|開始|発表|公開)(された|した|れた)/;
      if (!historicalFactPattern.test(text)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Web検索結果を使った回答生成
 *
 * AIの初期応答に最新情報が不足している場合、Web検索結果を用いて
 * 情報を補完した新たな回答を生成します。
 *
 * @param prompt ユーザーの質問
 * @param initialResponse AIの初期応答
 * @returns Web検索結果で補完された応答
 */
async function generateResponseWithWebSearch(
  prompt: string,
  initialResponse: string
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
      model: "gpt-4o-mini",
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

/**
 * 初期応答を生成する関数
 *
 * ユーザーの質問に対する最初のAI応答を生成します。
 * システムプロンプトでは、AIに最新情報がない場合は正直に伝えるよう指示しています。
 *
 * @param prompt ユーザーの質問
 * @param signal アボートシグナル（タイムアウト用）
 * @returns AIの初期応答
 */
async function generateInitialResponse(
  prompt: string,
  signal: AbortSignal
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
      model: "gpt-4o-mini",
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
    const { prompt } = body;

    // 入力の検証
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    // 入力のサニタイズ
    const sanitizedPrompt = sanitizeInput(prompt);

    // タイムアウト設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25秒でタイムアウト

    try {
      // 初期応答を生成
      const responseContent = await generateInitialResponse(
        sanitizedPrompt,
        controller.signal
      );

      // Web検索が必要かチェック
      let finalResponse = responseContent;
      if (needsWebSearchInfo(responseContent)) {
        console.log("Web検索による情報の補完が必要と判断されました");
        finalResponse = await generateResponseWithWebSearch(
          sanitizedPrompt,
          responseContent
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
