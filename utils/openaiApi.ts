/**
 * OpenAI APIを呼び出してチャットボットの応答を取得する
 * @param prompt ユーザーの入力メッセージ
 * @param signal AbortControllerからのシグナル（タイムアウト用）
 * @returns チャットボットの応答データ（テキスト、HTML、マークダウンフラグ）
 */
export async function getChatbotResponse(
  prompt: string,
  signal?: AbortSignal
): Promise<{ text: string; html?: string; isMarkdown?: boolean }> {
  try {
    // 入力の検証
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("入力が必要です");
    }

    // 入力のサニタイズ（セキュリティ対策）
    const sanitizedPrompt = prompt.trim().slice(0, 1000); // 1000文字に制限

    // APIリクエスト
    const response = await fetch("/api/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: sanitizedPrompt }),
      signal, // AbortControllerシグナルを渡す
    });

    // レスポンスのステータスコードチェック
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || "バックエンドからの応答の取得に失敗しました";

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

    return {
      text: data.text || "",
      html: data.html || undefined,
      isMarkdown: data.isMarkdown || false,
    };
  } catch (error: any) {
    // エラーの種類によって適切なメッセージを返す
    if (error.name === "AbortError") {
      console.error("Request was aborted", error);
      throw new Error(
        "リクエストがタイムアウトしました。もう一度お試しください。"
      );
    }

    if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      console.error("Network error:", error);
      throw new Error(
        "ネットワークエラーが発生しました。接続を確認してください。"
      );
    }

    console.error("Error fetching chatbot response:", error);
    throw error;
  }
}
