/**
 * ローディングインジケーターコンポーネント
 *
 * ボットの応答待ち状態を視覚的に表現するためのアニメーション付きドット
 * アニメーションの遅延をずらすことで波のような動きを実現しています
 */
import { FC } from "react";

export const LoadingIndicator: FC = () => (
  <div className="flex space-x-2 items-center">
    <div
      className="w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full animate-bounce"
      style={{ animationDelay: "0ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full animate-bounce"
      style={{ animationDelay: "150ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full animate-bounce"
      style={{ animationDelay: "300ms" }}
    ></div>
  </div>
);
