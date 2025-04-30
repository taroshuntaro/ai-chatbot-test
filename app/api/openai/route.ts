import { NextResponse } from "next/server";
import OpenAI from "openai";
import { marked } from "marked";
import { rateLimit } from "../../utils/rateLimit";

// OpenAIのクライアントを初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 入力の検証とサニタイズ
function sanitizeInput(input: string): string {
  // 特殊文字をエスケープし、長さを制限
  return input.slice(0, 1000); // 入力を1000文字に制限
}

// レート制限の設定
const limiter = rateLimit({
  interval: 60 * 1000, // 1分
  uniqueTokenPerInterval: 50, // 1分間に許可する固有のIPアドレス数
});

export async function POST(req: Request) {
  try {
    // クライアントのIPアドレスを取得 (Next.jsの環境に合わせて調整)
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
      // OpenAI APIを呼び出し
      const response = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: sanitizedPrompt }],
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          signal: controller.signal,
          // タイムアウトはAbortControllerで制御する
        }
      );

      clearTimeout(timeoutId);

      // レスポンスの検証
      const responseContent =
        response.choices[0]?.message?.content?.trim() || "";

      // Markdownをリッチテキスト(HTML)に変換
      const htmlContent = marked(responseContent);

      return NextResponse.json({
        text: responseContent,
        html: htmlContent, // HTMLに変換したコンテンツ
        isMarkdown: true, // クライアント側でマークダウンであることを識別するためのフラグ
      });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error; // 外部のエラーハンドリングに委譲
    }
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error);

    // エラータイプによって適切なレスポンスを返す
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }

    // OpenAIのエラーコードを処理
    const status = error.status || 500;

    return NextResponse.json(
      { error: "Failed to fetch response from OpenAI", details: error.message },
      { status }
    );
  }
}
