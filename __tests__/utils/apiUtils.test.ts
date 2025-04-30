import { sanitizeInput } from "@/app/utils/openai/apiUtils";

// OpenAIモジュールをモック化
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      };
    }),
  };
});

describe("apiUtils ユーティリティ", () => {
  describe("sanitizeInput 関数", () => {
    test("1000文字を超える入力が1000文字に制限されること", () => {
      // 1200文字の入力を作成
      const longInput = "a".repeat(1200);

      // 関数を実行
      const result = sanitizeInput(longInput);

      // 結果が1000文字に制限されていることを確認
      expect(result.length).toBe(1000);
      expect(result).toBe("a".repeat(1000));
    });

    test("1000文字未満の入力はそのまま返されること", () => {
      const input = "これはテスト入力です。";

      const result = sanitizeInput(input);

      expect(result).toBe(input);
      expect(result.length).toBe(input.length);
    });

    test("ちょうど1000文字の入力はそのまま返されること", () => {
      const input = "a".repeat(1000);

      const result = sanitizeInput(input);

      expect(result.length).toBe(1000);
      expect(result).toBe(input);
    });

    test("空の文字列も正しく処理されること", () => {
      const input = "";

      const result = sanitizeInput(input);

      expect(result).toBe("");
      expect(result.length).toBe(0);
    });
  });
});
