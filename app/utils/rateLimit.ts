/**
 * レート制限を実装するためのユーティリティ
 * 特定の時間間隔内のリクエスト数を制限します
 */
export interface RateLimiterOptions {
  interval: number; // 制限の間隔（ミリ秒）
  uniqueTokenPerInterval: number; // 間隔あたりの一意のトークン（IPアドレスなど）の最大数
}

export function rateLimit(options: RateLimiterOptions) {
  const { interval, uniqueTokenPerInterval } = options;

  // トークンごとのリクエスト回数を追跡
  const tokenRequests = new Map<string, number[]>();

  // 期限切れのトークンをクリーンアップするためのタイマー
  setInterval(() => {
    const now = Date.now();

    // 各トークンのタイムスタンプを確認し、期限切れのものを削除
    for (const [token, timestamps] of tokenRequests.entries()) {
      const validTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < interval
      );

      if (validTimestamps.length === 0) {
        tokenRequests.delete(token);
      } else {
        tokenRequests.set(token, validTimestamps);
      }
    }
  }, interval);

  // レート制限を確認する関数
  async function check(maxRequests: number, token: string): Promise<void> {
    // トークンの現在のリクエスト回数を取得
    const timestamps = tokenRequests.get(token) || [];
    const now = Date.now();

    // 現在の間隔内のリクエスト数を計算
    const recentRequests = timestamps.filter(
      (timestamp) => now - timestamp < interval
    );

    // 制限をチェック
    if (recentRequests.length >= maxRequests) {
      throw new Error(`Rate limit exceeded for token: ${token}`);
    }

    // 新しいリクエストを追加
    recentRequests.push(now);
    tokenRequests.set(token, recentRequests);

    // トークン数のチェック
    if (tokenRequests.size > uniqueTokenPerInterval) {
      // 最も古いトークンを削除
      const oldestToken = [...tokenRequests.entries()].sort(
        (a, b) => Math.min(...a[1]) - Math.min(...b[1])
      )[0][0];
      tokenRequests.delete(oldestToken);
    }
  }

  return { check };
}
