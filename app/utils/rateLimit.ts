/**
 * レート制限を実装するためのユーティリティ
 *
 * このモジュールは、特定の時間間隔内のリクエスト数を制限する機能を提供します。
 * 主にAPI呼び出しやバックエンドリクエストの過負荷を防止するために使用されます。
 *
 * 特徴:
 * - 指定された時間間隔（ミリ秒）内のリクエスト数を制限
 * - 各クライアント（IPアドレスなど）ごとに個別のカウンターを管理
 * - 期限切れのカウンターを自動クリーンアップ
 * - 同時アクセスクライアント数の制限
 *
 * @module rateLimit
 */

/**
 * レート制限の設定オプション
 */
export interface RateLimiterOptions {
  /** 制限の間隔（ミリ秒） */
  interval: number;
  /** 間隔あたりの一意のトークン（IPアドレスなど）の最大数 */
  uniqueTokenPerInterval: number;
}

/**
 * レート制限結果
 */
interface RateLimiter {
  /** リクエストがレート制限を超えていないか確認する関数 */
  check: (maxRequests: number, token: string) => Promise<void>;
}

/**
 * トークンのリクエストを追跡するタイムスタンプの型
 */
type TokenTimestamps = Map<string, number[]>;

/**
 * レート制限機能を生成する
 *
 * @param options レート制限の設定
 * @returns レート制限チェック関数を含むオブジェクト
 */
export function rateLimit(options: RateLimiterOptions): RateLimiter {
  const { interval, uniqueTokenPerInterval } = options;

  // トークンごとのリクエスト回数を追跡
  const tokenRequests: TokenTimestamps = new Map<string, number[]>();

  // 期限切れのトークンをクリーンアップするためのタイマー
  setInterval(() => {
    cleanupExpiredTokens(tokenRequests, interval);
  }, interval);

  // レート制限を確認する関数
  async function check(maxRequests: number, token: string): Promise<void> {
    // 無効なパラメーターのチェック
    if (maxRequests <= 0 || !token) {
      throw new Error("Invalid parameters for rate limit check");
    }

    // トークンの現在のリクエスト回数を取得
    const timestamps = tokenRequests.get(token) || [];
    const now = Date.now();

    // 現在の間隔内のリクエスト数を計算
    const recentRequests = filterRecentRequests(timestamps, now, interval);

    // 制限をチェック
    if (recentRequests.length >= maxRequests) {
      throw new Error(`Rate limit exceeded for token: ${token}`);
    }

    // 新しいリクエストを追加
    recentRequests.push(now);
    tokenRequests.set(token, recentRequests);

    // 一意のトークン数の制限をチェック
    enforceUniqueTokenLimit(tokenRequests, uniqueTokenPerInterval);
  }

  return { check };
}

/**
 * 期限切れのトークンとタイムスタンプをクリーンアップする
 *
 * @param tokenRequests トークンタイムスタンプのマップ
 * @param interval 有効期間（ミリ秒）
 */
function cleanupExpiredTokens(
  tokenRequests: TokenTimestamps,
  interval: number
): void {
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
}

/**
 * 指定された期間内のリクエストのみをフィルタリングする
 *
 * @param timestamps タイムスタンプの配列
 * @param now 現在の時刻（ミリ秒）
 * @param interval 有効期間（ミリ秒）
 * @returns 有効期間内のタイムスタンプ配列
 */
function filterRecentRequests(
  timestamps: number[],
  now: number,
  interval: number
): number[] {
  return timestamps.filter((timestamp) => now - timestamp < interval);
}

/**
 * 一意のトークン数を制限する
 * トークン数が上限を超えた場合、最も古いトークンを削除する
 *
 * @param tokenRequests トークンタイムスタンプのマップ
 * @param uniqueTokenLimit 最大トークン数
 */
function enforceUniqueTokenLimit(
  tokenRequests: TokenTimestamps,
  uniqueTokenLimit: number
): void {
  if (tokenRequests.size <= uniqueTokenLimit) {
    return; // トークン数が上限以下なら何もしない
  }

  // 最も古いタイムスタンプを持つトークンを特定
  let oldestToken: string | null = null;
  let oldestTimestamp = Infinity;

  for (const [token, timestamps] of tokenRequests.entries()) {
    const earliestTimestamp = Math.min(...timestamps);
    if (earliestTimestamp < oldestTimestamp) {
      oldestTimestamp = earliestTimestamp;
      oldestToken = token;
    }
  }

  // 最も古いトークンを削除
  if (oldestToken) {
    tokenRequests.delete(oldestToken);
  }
}
