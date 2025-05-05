/**
 * アプリケーションレイアウトコンポーネント
 *
 * ドロワーメニューを備えたメインレイアウトを提供します。
 * クライアントコンポーネントとして実装し、ドロワーの状態管理を行います。
 *
 * @module AppLayout
 */
"use client";

import { ReactNode, useState } from "react";
import Drawer, { DrawerToggleButton } from "@/components/Drawer";

/**
 * ドロワーメニューを備えたアプリケーションレイアウトコンポーネント
 *
 * @param children レイアウト内に表示する子コンポーネント
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  // ドロワーの開閉状態を管理するstate
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  /**
   * ドロワーを開く関数
   */
  const openDrawer = () => {
    try {
      setIsDrawerOpen(true);
    } catch (error) {
      console.error("ドロワーを開く処理でエラーが発生しました:", error);
    }
  };

  /**
   * ドロワーを閉じる関数
   */
  const closeDrawer = () => {
    try {
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("ドロワーを閉じる処理でエラーが発生しました:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ドロワーメニュー */}
      <Drawer isOpen={isDrawerOpen} onClose={closeDrawer} />

      {/* ドロワー表示ボタン - 左上に固定表示 */}
      <div className="fixed top-4 left-4 z-30">
        <DrawerToggleButton onClick={openDrawer} />
      </div>

      {/* メインコンテンツ */}
      <main className="flex-grow px-4 sm:px-8">{children}</main>
    </div>
  );
}
