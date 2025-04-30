import { getChatbotResponse } from "@/utils/openaiApi";
import { DEFAULT_MODEL } from "@/types/model";

// fetchのモック
global.fetch = jest.fn();

describe("openaiApi ユーティリティ", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getChatbotResponse 関数", () => {
    test("空の入力に対してエラーをスローすること", async () => {
      await expect(getChatbotResponse("")).rejects.toThrow("入力が必要です");
      await expect(getChatbotResponse("   ")).rejects.toThrow("入力が必要です");
    });

    test("成功レスポンスを適切に処理すること", async () => {
      // fetchのモック実装
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          text: "これはテスト回答です",
          html: "<p>これはテスト回答です</p>",
          isMarkdown: true,
        }),
      });

      const result = await getChatbotResponse("テスト質問");

      // fetchが正しく呼び出されたことを確認
      expect(global.fetch).toHaveBeenCalledWith("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "テスト質問",
          model: DEFAULT_MODEL,
        }),
        signal: undefined,
      });

      // 結果が正しいことを確認
      expect(result).toEqual({
        text: "これはテスト回答です",
        html: "<p>これはテスト回答です</p>",
        isMarkdown: true,
      });
    });

    test("モデルを指定して呼び出せること", async () => {
      // fetchのモック実装
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          text: "これはテスト回答です",
          html: "<p>これはテスト回答です</p>",
          isMarkdown: true,
        }),
      });

      const result = await getChatbotResponse(
        "テスト質問",
        undefined,
        "gpt-3.5-turbo"
      );

      // fetchが正しく呼び出されたことを確認
      expect(global.fetch).toHaveBeenCalledWith("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "テスト質問",
          model: "gpt-3.5-turbo",
        }),
        signal: undefined,
      });

      // 結果が正しいことを確認
      expect(result).toEqual({
        text: "これはテスト回答です",
        html: "<p>これはテスト回答です</p>",
        isMarkdown: true,
      });
    });

    test("入力が1000文字に制限されること", async () => {
      // 1200文字の入力を作成
      const longInput = "a".repeat(1200);

      // fetchのモック実装
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          text: "回答",
          isMarkdown: false,
        }),
      });

      await getChatbotResponse(longInput);

      // fetchの呼び出し引数を取得
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // 送信されたプロンプトが1000文字に制限されていることを確認
      expect(requestBody.prompt.length).toBe(1000);
      // モデルが設定されていることを確認
      expect(requestBody.model).toBe(DEFAULT_MODEL);
    });

    test("エラーレスポンスを適切に処理すること", async () => {
      // fetchのモック実装 - 429エラー（レート制限）
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValueOnce({
          error: "Too many requests",
        }),
      });

      await expect(getChatbotResponse("テスト質問")).rejects.toThrow(
        "リクエスト回数の制限を超えました"
      );

      // fetchのモック実装 - 504エラー（タイムアウト）
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 504,
        json: jest.fn().mockResolvedValueOnce({
          error: "Gateway timeout",
        }),
      });

      await expect(getChatbotResponse("テスト質問")).rejects.toThrow(
        "リクエストがタイムアウトしました"
      );

      // fetchのモック実装 - その他のエラー
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValueOnce({
          error: "Internal server error",
        }),
      });

      await expect(getChatbotResponse("テスト質問")).rejects.toThrow(
        "Internal server error"
      );
    });

    test("ネットワークエラーを適切に処理すること", async () => {
      // fetchのモック実装 - ネットワークエラー
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      await expect(getChatbotResponse("テスト質問")).rejects.toThrow(
        "ネットワークエラーが発生しました"
      );
    });

    test("タイムアウトエラーを適切に処理すること", async () => {
      // AbortErrorをシミュレート
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";

      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      await expect(getChatbotResponse("テスト質問")).rejects.toThrow(
        "リクエストがタイムアウトしました"
      );
    });

    test("無効なレスポンス形式に対してエラーをスローすること", async () => {
      // fetchのモック実装 - 不正なレスポンス形式
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          // textプロパティがない
          isMarkdown: false,
        }),
      });

      await expect(getChatbotResponse("テスト質問")).rejects.toThrow(
        "無効なレスポンス形式です"
      );
    });
  });
});
