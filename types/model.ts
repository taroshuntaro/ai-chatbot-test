/**
 * チャットボットで使用できるLLMモデルを定義するモジュール
 *
 * このファイルは、以下を提供します：
 * - 利用可能なモデルの型定義
 * - デフォルトモデルの設定
 * - モデル表示名のマッピング
 * - テストモードの設定と管理
 *
 * @module types/model
 */

/**
 * 利用可能なOpenAIモデルの型定義
 */
export type OpenAIModel = "gpt-3.5-turbo" | "gpt-4o-mini" | "test-model";

/**
 * デフォルトモデル設定
 * アプリケーション起動時に初期選択されるモデル
 */
export const DEFAULT_MODEL: OpenAIModel = "gpt-4o-mini";

/**
 * テストモード環境変数キー
 */
const TEST_MODE_ENV_KEY = "NEXT_PUBLIC_ENABLE_TEST_MODE";

/**
 * テストモードの有効値
 */
const TEST_MODE_ENABLED_VALUE = "true";

/**
 * テストモードが有効かどうかを確認する関数
 *
 * サーバーサイド実行時（window未定義時）は常にfalseを返します
 *
 * @returns テストモードが有効ならtrue
 */
export const isTestModeEnabled = (): boolean => {
  // サーバーサイドでは常にtrue
  if (typeof window === "undefined") return true;

  // 環境変数の値をチェック
  return process.env[TEST_MODE_ENV_KEY] === TEST_MODE_ENABLED_VALUE;
};

/**
 * 基本モデルリスト（テストモードに関わらず常に利用可能）
 */
const BASE_MODELS: OpenAIModel[] = ["gpt-3.5-turbo", "gpt-4o-mini"];

/**
 * テストモデル（テストモード時のみ追加）
 */
const TEST_MODEL: OpenAIModel = "test-model";

/**
 * 選択可能なモデルのリスト
 * テストモードが有効の場合はテストモデルを追加
 */
export const AVAILABLE_MODELS: OpenAIModel[] = isTestModeEnabled()
  ? [...BASE_MODELS, TEST_MODEL]
  : [...BASE_MODELS];

/**
 * モデル表示名のマッピング
 * UIに表示する名称を定義
 */
export const MODEL_DISPLAY_NAMES: Record<OpenAIModel, string> = {
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "gpt-4o-mini": "GPT-4o Mini",
  "test-model": "テスト用モデル（APIなし）",
};
