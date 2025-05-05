/**
 * ユーザー入力を受け付けるインプットバーコンポーネント
 *
 * このコンポーネントは、ユーザーがチャットメッセージを入力・送信するためのUIを提供します。
 * 主な機能:
 * - テキスト入力とバリデーション
 * - 入力文字数の制限
 * - セキュリティのための入力サニタイズ
 * - エンターキーによる送信（Shift+Enterによる改行対応）
 * - IME入力のハンドリング（日本語等の入力中は送信しない）
 * - LLMモデル選択機能
 *
 * @module InputBar
 */
"use client";

import { useState, FC, ChangeEvent, KeyboardEvent } from "react";
import { OpenAIModel } from "@/types/model";
import ModelSelector from "@/components/ModelSelector";
import DOMPurify from "dompurify";

interface InputBarProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  selectedModel: OpenAIModel;
  onModelChange: (model: OpenAIModel) => void;
}

/**
 * 入力関連の定数
 */
const INPUT_CONSTANTS = {
  /**
   * 入力可能な最大文字数
   * サーバー側の制限と合わせています
   */
  MAX_LENGTH: 1000,

  /**
   * 入力欄のプレースホルダーテキスト
   */
  PLACEHOLDER: "メッセージを入力...",

  /**
   * アクセシビリティ用ラベル
   */
  ARIA_LABEL: "メッセージ入力",

  /**
   * 送信ボタンのラベル
   */
  SUBMIT_BUTTON_LABEL: "送信",

  /**
   * 送信ボタンのアクセシビリティラベル
   */
  SUBMIT_ARIA_LABEL: "送信",
};

/**
 * テキストをサニタイズする関数
 * DOMPurifyを使用してHTMLタグを削除し、XSS攻撃を防止します
 * また、最大文字数を超える入力も切り捨てます
 *
 * @param text サニタイズする入力テキスト
 * @returns サニタイズ済みテキスト
 */
const sanitizeInputText = (text: string): string => {
  try {
    const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
    return sanitized.substring(0, INPUT_CONSTANTS.MAX_LENGTH);
  } catch (error) {
    console.error("テキストのサニタイズ中にエラーが発生しました:", error);
    // エラー時は空の文字列を返すことで安全性を確保
    return "";
  }
};

/**
 * インプットバーコンポーネント
 */
const InputBar: FC<InputBarProps> = ({
  input,
  setInput,
  handleSend,
  selectedModel,
  onModelChange,
}) => {
  // IME入力中かどうかの状態（日本語などの入力中にEnterで確定できるようにするため）
  const [isComposing, setIsComposing] = useState(false);

  /**
   * テキストエリアの変更イベントハンドラ
   *
   * ユーザー入力をサニタイズして状態を更新します
   *
   * @param e 変更イベント
   */
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const sanitizedInput = sanitizeInputText(e.target.value);
      setInput(sanitizedInput);
    } catch (error) {
      console.error("入力変更処理中にエラーが発生しました:", error);
    }
  };

  /**
   * キーダウンイベントハンドラ
   *
   * エンターキーで送信、Shift+Enterで改行を行います
   * IME入力中（isComposing=true）の場合は送信せず、確定処理を優先します
   *
   * @param e キーボードイベント
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    try {
      if (e.key === "Enter" && !isComposing && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    } catch (error) {
      console.error("キー入力処理中にエラーが発生しました:", error);
    }
  };

  /**
   * IME入力開始ハンドラ
   * 日本語などの入力が始まったことを記録
   */
  const handleCompositionStart = () => {
    try {
      setIsComposing(true);
    } catch (error) {
      console.error("IME入力開始処理中にエラーが発生しました:", error);
    }
  };

  /**
   * IME入力終了ハンドラ
   * 日本語などの入力が確定したことを記録
   */
  const handleCompositionEnd = () => {
    try {
      setIsComposing(false);
    } catch (error) {
      console.error("IME入力終了処理中にエラーが発生しました:", error);
    }
  };

  /**
   * 送信ボタンが無効かどうかを判定
   */
  const isSubmitDisabled = !input.trim();

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-white dark:bg-gray-800 shadow-inner border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-3xl mx-auto flex flex-col">
        <div className="flex justify-end mb-2 mr-20">
          <ModelSelector
            selectedModel={selectedModel}
            onChange={onModelChange}
          />
        </div>
        <div className="flex items-center">
          <textarea
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none h-16 bg-white dark:bg-gray-700 text-black dark:text-white"
            placeholder={INPUT_CONSTANTS.PLACEHOLDER}
            aria-label={INPUT_CONSTANTS.ARIA_LABEL}
            maxLength={INPUT_CONSTANTS.MAX_LENGTH}
          />
          <button
            onClick={handleSend}
            disabled={isSubmitDisabled}
            className={`ml-4 p-3 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-transform transform active:scale-95 ${
              isSubmitDisabled
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            aria-label={INPUT_CONSTANTS.SUBMIT_ARIA_LABEL}
          >
            {INPUT_CONSTANTS.SUBMIT_BUTTON_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputBar;
