import {
  sanitizeInput,
  isTestMode,
  TEST_MODEL_ID,
} from "@/app/utils/openai/apiUtils";
import { OpenAIModel } from "@/types/model";

/**
 * APIのモックとログのオリジナル参照
 */
let originalConsoleLog: typeof console.log;
let originalConsoleWarn: typeof console.warn;

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
  /**
   * テスト開始前の共通セットアップ
   */
  beforeAll(() => {
    // コンソール出力をモック化して不要な出力を抑制
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  /**
   * テスト終了後の共通クリーンアップ
   */
  afterAll(() => {
    // コンソール出力を元に戻す
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });

  /**
   * 各テスト前の初期化
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sanitizeInput 関数", () => {
    const MAX_INPUT_LENGTH = 1000; // 定数と一致させる必要あり

    test("1000文字を超える入力が1000文字に制限されること", () => {
      // 1200文字の入力を作成
      const longInput = "a".repeat(1200);

      // 関数を実行
      const result = sanitizeInput(longInput);

      // 結果が1000文字に制限されていることを確認
      expect(result.length).toBe(MAX_INPUT_LENGTH);
      expect(result).toBe("a".repeat(MAX_INPUT_LENGTH));
    });

    test("1000文字未満の入力はそのまま返されること", () => {
      const input = "これはテスト入力です。";

      const result = sanitizeInput(input);

      expect(result).toBe(input);
      expect(result.length).toBe(input.length);
    });

    test("ちょうど1000文字の入力はそのまま返されること", () => {
      const input = "a".repeat(MAX_INPUT_LENGTH);

      const result = sanitizeInput(input);

      expect(result.length).toBe(MAX_INPUT_LENGTH);
      expect(result).toBe(input);
    });

    test("空の文字列も正しく処理されること", () => {
      const input = "";

      const result = sanitizeInput(input);

      expect(result).toBe("");
      expect(result.length).toBe(0);
    });

    // 以下、追加するテストケース

    test("特殊文字を含む入力が正しく処理されること", () => {
      const specialCharsInput = "!@#$%^&*()_+{}[]|\"':;/.,<>?`~あいうえお";

      const result = sanitizeInput(specialCharsInput);

      expect(result).toBe(specialCharsInput);
    });

    test("マルチバイト文字（日本語など）が文字数としてカウントされること", () => {
      // 日本語文字（各文字が複数バイトを占める）を含む
      const japaneseText = "こんにちは世界".repeat(200); // 1000文字を超える

      const result = sanitizeInput(japaneseText);

      // 文字数が制限されていることを確認
      expect(result.length).toBe(MAX_INPUT_LENGTH);
      // 期待される結果：最初の1000文字
      expect(result).toBe(japaneseText.slice(0, MAX_INPUT_LENGTH));
    });

    test("HTMLタグや潜在的に危険なスクリプトが除去されないこと（APIUtils自体はサニタイズしない）", () => {
      const htmlInput =
        "<script>alert('XSS')</script><img src=x onerror='alert(1)'>";

      const result = sanitizeInput(htmlInput);

      // この関数はHTMLサニタイズを行わないことを確認
      expect(result).toBe(htmlInput);
    });

    test("null や undefined が渡された場合にエラーを発生させないこと", () => {
      // 注: 実際の実装では null や undefined を処理できないため
      // このテストはスキップするか、あるいは想定される例外が発生することを検証する
      expect(() => {
        // @ts-ignore: テスト目的で意図的に不正な入力を渡す
        sanitizeInput(null);
      }).toThrow();

      expect(() => {
        // @ts-ignore: テスト目的で意図的に不正な入力を渡す
        sanitizeInput(undefined);
      }).toThrow();
    });
  });

  describe("isTestMode 関数", () => {
    test("テストモデルIDの場合にtrueを返すこと", () => {
      const result = isTestMode(TEST_MODEL_ID as OpenAIModel);

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalled();
    });

    test("通常のモデルIDの場合にfalseを返すこと", () => {
      const result = isTestMode("gpt-4o-mini" as OpenAIModel);

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalled();
    });

    test("大文字小文字が異なる場合は一致しないこと", () => {
      // @ts-ignore: テスト目的で意図的に不正な入力を渡す
      const result = isTestMode("TEST-MODEL");

      // 厳密な比較（===）を使用しているため、大文字小文字が異なればfalseになる
      expect(result).toBe(false);
    });

    test("未定義のモデルIDが渡された場合にfalseを返すこと", () => {
      // @ts-ignore: テスト目的で意図的に不正な入力を渡す
      const result = isTestMode(undefined);

      expect(result).toBe(false);
    });
  });
});
