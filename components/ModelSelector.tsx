/**
 * モデル選択コンポーネント
 *
 * ユーザーがLLMモデルを選択するためのドロップダウンメニューを提供します。
 * 選択されたモデルはローカルストレージに保存され、ページをリロードしても維持されます。
 *
 * @module ModelSelector
 */
"use client";

import { FC, ChangeEvent } from "react";
import {
  AVAILABLE_MODELS,
  MODEL_DISPLAY_NAMES,
  OpenAIModel,
} from "@/types/model";

interface ModelSelectorProps {
  selectedModel: OpenAIModel;
  onChange: (model: OpenAIModel) => void;
}

/**
 * UI表示用の定数
 */
const UI_STRINGS = {
  /**
   * ラベルテキスト
   */
  LABEL_TEXT: "モデル:",

  /**
   * アクセシビリティラベル
   */
  ARIA_LABEL: "AIモデルを選択",
};

/**
 * モデル選択ドロップダウンコンポーネント
 *
 * 利用可能なLLMモデルを選択するためのUIを提供します
 *
 * @param selectedModel 現在選択されているモデル
 * @param onChange モデル変更時のコールバック関数
 */
const ModelSelector: FC<ModelSelectorProps> = ({ selectedModel, onChange }) => {
  /**
   * ドロップダウン選択変更ハンドラ
   *
   * @param e 選択変更イベント
   */
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value as OpenAIModel;
    onChange(newModel);
  };

  return (
    <div className="flex items-center space-x-2">
      <label
        htmlFor="model-selector"
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {UI_STRINGS.LABEL_TEXT}
      </label>
      <select
        id="model-selector"
        value={selectedModel}
        onChange={handleChange}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label={UI_STRINGS.ARIA_LABEL}
      >
        {AVAILABLE_MODELS.map((model) => (
          <option key={model} value={model}>
            {MODEL_DISPLAY_NAMES[model]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;
