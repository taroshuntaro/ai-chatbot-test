import { rateLimit, RateLimiterOptions } from "@/app/utils/rateLimit";

describe("rateLimit ユーティリティ", () => {
  // テスト用のタイマーをモック化
  jest.useFakeTimers();

  // 各テスト後にタイマーをリセット
  afterEach(() => {
    jest.clearAllTimers();
  });

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

  // このテストを修正
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
