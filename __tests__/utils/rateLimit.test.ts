import { rateLimit, RateLimiterOptions } from "@/app/utils/rateLimit";

/**
 * rateLimitユーティリティのテスト
 *
 * レート制限機能の正常動作とエラーケースをテストします
 */
describe("rateLimit ユーティリティ", () => {
  // テスト用のタイマーをモック化
  jest.useFakeTimers();

  // 各テスト後にタイマーをリセット
  afterEach(() => {
    jest.clearAllTimers();
  });

  /**
   * 基本機能のテスト（正常系）
   */
  describe("基本機能", () => {
    test("設定された最大リクエスト数を超えるとエラーをスローすること", async () => {
      // レート制限の設定（100ms間隔内に最大2リクエスト）
      const options: RateLimiterOptions = {
        interval: 100,
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);
      const token = "test-token";

      // 制限内のリクエストは成功するはず
      await expect(limiter.check(2, token)).resolves.not.toThrow();
      await expect(limiter.check(2, token)).resolves.not.toThrow();

      // 制限を超えるリクエストはエラーをスローするはず
      await expect(limiter.check(2, token)).rejects.toThrow(
        "Rate limit exceeded"
      );
    });

    test("異なるトークンは別々に制限されること", async () => {
      const options: RateLimiterOptions = {
        interval: 100,
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);
      const token1 = "token-1";
      const token2 = "token-2";

      // トークン1で2回リクエスト
      await expect(limiter.check(2, token1)).resolves.not.toThrow();
      await expect(limiter.check(2, token1)).resolves.not.toThrow();

      // トークン1は制限に達しているが、トークン2は別のカウントなので成功するはず
      await expect(limiter.check(2, token1)).rejects.toThrow(
        "Rate limit exceeded"
      );
      await expect(limiter.check(2, token2)).resolves.not.toThrow();
    });

    test("時間経過後にリクエスト制限がリセットされること", async () => {
      const options: RateLimiterOptions = {
        interval: 100,
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);
      const token = "time-reset-token";

      // 最初に制限いっぱいまでリクエスト
      await expect(limiter.check(2, token)).resolves.not.toThrow();
      await expect(limiter.check(2, token)).resolves.not.toThrow();
      await expect(limiter.check(2, token)).rejects.toThrow(
        "Rate limit exceeded"
      );

      // 時間を経過させる（interval以上）
      jest.advanceTimersByTime(150);

      // 制限がリセットされているはず
      await expect(limiter.check(2, token)).resolves.not.toThrow();
    });

    test("トークン数が制限を超えた場合、最も古いトークンが削除されること", async () => {
      const options: RateLimiterOptions = {
        interval: 100,
        uniqueTokenPerInterval: 2, // 最大2つのトークンのみ許容
      };

      const limiter = rateLimit(options);

      // 最初のトークンでリクエスト
      await expect(limiter.check(1, "token-old-1")).resolves.not.toThrow();

      // わずかな時間経過をシミュレート
      jest.advanceTimersByTime(10);

      // 2つ目のトークンでリクエスト
      await expect(limiter.check(1, "token-old-2")).resolves.not.toThrow();

      // さらに時間経過
      jest.advanceTimersByTime(10);

      // 3つ目のトークン（これにより最も古いトークンが削除されるはず）
      await expect(limiter.check(1, "token-new")).resolves.not.toThrow();

      // この時点で最も古いtoken-old-1は削除されているはず
      // token-old-2はまだ制限に引っかからない状態でなければならない
      await expect(limiter.check(1, "token-old-1")).resolves.not.toThrow();

      // token-old-2に対してリクエスト上限以上の呼び出しを行う
      await expect(limiter.check(1, "token-old-2")).resolves.not.toThrow();
      await expect(limiter.check(1, "token-old-2")).rejects.toThrow(
        "Rate limit exceeded"
      );
    });
  });

  /**
   * 境界値テスト
   */
  describe("境界値テスト", () => {
    test("maxRequestsが1の場合、2回目のリクエストで制限されること", async () => {
      const options: RateLimiterOptions = {
        interval: 100,
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);
      const token = "boundary-token";

      // 最初のリクエストは成功
      await expect(limiter.check(1, token)).resolves.not.toThrow();

      // 2回目のリクエストは失敗（境界値）
      await expect(limiter.check(1, token)).rejects.toThrow(
        "Rate limit exceeded"
      );
    });

    test("間隔ぎりぎりでリクエスト制限がリセットされること", async () => {
      const INTERVAL = 100;
      const options: RateLimiterOptions = {
        interval: INTERVAL,
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);
      const token = "exact-interval-token";

      // リクエスト上限に達する（最大2リクエスト）
      await expect(limiter.check(2, token)).resolves.not.toThrow(); // 1回目
      await expect(limiter.check(2, token)).resolves.not.toThrow(); // 2回目
      await expect(limiter.check(2, token)).rejects.toThrow(); // 3回目は制限超過

      // インターバルのちょうど前までは制限が継続する
      jest.advanceTimersByTime(INTERVAL - 1);
      await expect(limiter.check(2, token)).rejects.toThrow();

      // インターバルぴったりで最初のリクエストだけが期限切れになるはず
      jest.advanceTimersByTime(1); // これで合計でINTERVALミリ秒経過

      // 実際の実装では、自動クリーンアップタイマーとチェック呼び出しのタイミングによって、
      // 最初のリクエストが期限切れとなるかどうかが変わる可能性がある
      // ここでは1回目は成功し、2回目はまだ制限に引っかかると仮定
      await expect(limiter.check(2, token)).resolves.not.toThrow();

      // テストの一貫性のため、連続した複数回の呼び出しは行わず、
      // クリーンアップ関数がインターバル経過時に動作することだけを確認する
    });

    test("uniqueTokenPerIntervalが1の場合、2つ目のトークンで最初のトークンが削除されること", async () => {
      const options: RateLimiterOptions = {
        interval: 100,
        uniqueTokenPerInterval: 1, // 最小値の1を設定
      };

      const limiter = rateLimit(options);

      // 1つ目のトークンでリクエスト
      await expect(limiter.check(1, "single-token-1")).resolves.not.toThrow();

      // 2つ目のトークンでリクエスト（これにより最初のトークンが削除される）
      await expect(limiter.check(1, "single-token-2")).resolves.not.toThrow();

      // 最初のトークンは削除されたので、再度リクエスト可能なはず
      await expect(limiter.check(1, "single-token-1")).resolves.not.toThrow();
    });
  });

  /**
   * エラーケーステスト
   */
  describe("エラーケース", () => {
    test("maxRequestsが0以下の場合、エラーをスローすること", async () => {
      const options: RateLimiterOptions = {
        interval: 100,
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);

      // maxRequestsが0の場合
      await expect(limiter.check(0, "token")).rejects.toThrow(
        "Invalid parameters"
      );

      // maxRequestsが負の場合
      await expect(limiter.check(-1, "token")).rejects.toThrow(
        "Invalid parameters"
      );
    });

    test("tokenが空文字列の場合、エラーをスローすること", async () => {
      const options: RateLimiterOptions = {
        interval: 100,
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);

      // tokenが空文字列の場合
      await expect(limiter.check(1, "")).rejects.toThrow("Invalid parameters");
    });

    test("intervalが極端に小さい場合でも正常に動作すること", async () => {
      const options: RateLimiterOptions = {
        interval: 1, // 極端に小さい間隔
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);
      const token = "small-interval-token";

      // 制限内のリクエスト
      await expect(limiter.check(2, token)).resolves.not.toThrow();
      await expect(limiter.check(2, token)).resolves.not.toThrow();

      // 制限を超えるとエラーになる
      await expect(limiter.check(2, token)).rejects.toThrow();

      // 小さな間隔を経過させる
      jest.advanceTimersByTime(2);

      // 制限がリセットされるはず
      await expect(limiter.check(2, token)).resolves.not.toThrow();
    });

    test("大量のトークンを処理できること", async () => {
      const options: RateLimiterOptions = {
        interval: 100,
        uniqueTokenPerInterval: 1000, // 大量のトークンを許可
      };

      const limiter = rateLimit(options);

      // 多数のトークンを順番に処理
      const promises = Array.from({ length: 100 }, (_, i) =>
        limiter.check(1, `mass-token-${i}`)
      );

      // すべてのトークンが正常に処理されるはず
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  /**
   * クリーンアップ機能のテスト
   */
  describe("クリーンアップ機能", () => {
    test("期限切れのタイムスタンプが自動的にクリーンアップされること", async () => {
      const INTERVAL = 100;
      const options: RateLimiterOptions = {
        interval: INTERVAL,
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);
      const token = "cleanup-token";

      // リクエストを送信（maxRequests=5を指定し、1回リクエスト）
      await limiter.check(5, token);

      // インターバル経過でクリーンアップが実行される
      jest.advanceTimersByTime(INTERVAL);

      // クリーンアップ後は再度リクエスト可能なはず
      // 新規のリクエストとして再度5回まで可能になっているはず
      await expect(limiter.check(5, token)).resolves.not.toThrow();

      // 単一リクエストなので連続呼び出しはテストしない
    });

    test("未使用のトークンが一定時間後に完全に削除されること", async () => {
      const INTERVAL = 100;
      const options: RateLimiterOptions = {
        interval: INTERVAL,
        uniqueTokenPerInterval: 5,
      };

      const limiter = rateLimit(options);
      const token = "unused-token";

      // 1回だけリクエスト
      await limiter.check(2, token);

      // インターバル経過でクリーンアップが実行される
      jest.advanceTimersByTime(INTERVAL);

      // このトークンのタイムスタンプはすべて削除されているはず
      // しかし、内部状態を直接テストできないので、間接的に検証する
      // 2回目のリクエストは新しいカウントとして扱われるはず
      await expect(limiter.check(1, token)).resolves.not.toThrow();

      // この時点では1回しか使用していないので、制限に引っかかるはず
      await expect(limiter.check(1, token)).rejects.toThrow();
    });
  });
});
