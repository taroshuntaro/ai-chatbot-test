/**
 * サイドメニュードロワーコンポーネント
 *
 * 画面左側に表示されるドロワーメニューとそのトグルボタンを提供します。
 *
 * @module Drawer
 */
import { ReactNode } from "react";
import ThemeToggleButton from "@/components/ThemeToggleButton";

/**
 * ドロワーUIに関連する定数
 */
const DRAWER_UI = {
  /**
   * ドロワーを閉じるボタンのアクセシビリティラベル
   */
  CLOSE_LABEL: "閉じる",

  /**
   * ドロワーを開くボタンのアクセシビリティラベル
   */
  OPEN_LABEL: "メニューを開く",

  /**
   * テーマ切り替えセクションのラベル
   */
  THEME_SECTION_LABEL: "テーマ切り替え",
};

/**
 * ドロワーの表示状態を管理するためのprops型定義
 */
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

/**
 * 画面左側に表示されるドロワーメニューコンポーネント
 * @param isOpen ドロワーの表示状態
 * @param onClose ドロワーを閉じる際に呼ばれる関数
 * @param children 子要素（オプション）
 */
const Drawer = ({ isOpen, onClose, children }: DrawerProps) => {
  return (
    <>
      {/* オーバーレイ - ドロワーが開いているときだけ表示 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ドロワーメニュー本体 */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* ドロワーコンテンツ全体をflex-colで配置し、メインコンテンツとフッターエリアを分離 */}
        <div className="flex flex-col h-full">
          {/* ヘッダーと主要メニューを含むエリア */}
          <div className="flex-1 p-4">
            {/* 閉じるボタン */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label={DRAWER_UI.CLOSE_LABEL}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* メニュー項目コンテナ */}
            <div className="mt-8 space-y-6">
              {/* その他のメニュー項目 */}
              {children}
            </div>
          </div>

          {/* フッターエリア - テーマ切り替えボタンを配置 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {DRAWER_UI.THEME_SECTION_LABEL}
              </span>
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * ドロワーメニューを開閉するためのトグルボタンコンポーネント
 * @param onClick クリック時に呼ばれる関数
 */
export const DrawerToggleButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
      aria-label={DRAWER_UI.OPEN_LABEL}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
};

export default Drawer;
