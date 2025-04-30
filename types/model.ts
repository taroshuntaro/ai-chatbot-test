/**
 * チャットボットで使用できるLLMモデルを定義
 */

// 使用可能なLLMモデルの定義
export type OpenAIModel = "gpt-3.5-turbo" | "gpt-4o-mini";

// デフォルトのモデル
export const DEFAULT_MODEL: OpenAIModel = "gpt-4o-mini";

// 選択可能なモデルのリスト
export const AVAILABLE_MODELS: OpenAIModel[] = ["gpt-3.5-turbo", "gpt-4o-mini"];

// モデル表示名のマッピング
export const MODEL_DISPLAY_NAMES: Record<OpenAIModel, string> = {
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "gpt-4o-mini": "GPT-4o Mini",
};
