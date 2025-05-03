/**
 * チャットメッセージ関連の型定義
 *
 * このファイルはチャットアプリケーションで使用されるメッセージの型定義を提供します:
 * - ユーザーとボット間のメッセージ構造
 * - Web検索結果の構造
 * - 各種フラグやメタデータ
 *
 * @module types/message
 */

/**
 * Web検索結果の型定義
 *
 * AI応答の情報源として表示される検索結果のデータ構造
 */
export interface SearchResult {
  /** 検索結果のタイトル */
  title: string;
  /** 検索結果のURL */
  url: string;
  /** 検索結果の説明文 */
  description: string;
}

/**
 * チャットメッセージの型定義
 *
 * ユーザーからの入力とボットからの応答を表すデータ構造
 */
export interface Message {
  /** メッセージの一意識別子 */
  id: string;
  /** メッセージの送信者（user: ユーザー、bot: AI） */
  sender: "user" | "bot";
  /** メッセージのテキスト内容 */
  text: string;
  /** Markdownから変換されたHTMLコンテンツ（リッチテキスト表示用） */
  html?: string;
  /** コンテンツがMarkdown形式かどうかを示すフラグ */
  isMarkdown?: boolean;
  /** 処理中のメッセージかどうかを示すフラグ（ローディング状態表示用） */
  isLoading?: boolean;
  /** メッセージのタイムスタンプ */
  timestamp?: string;
  /** 検索結果を格納するための配列（AIが外部情報を参照した場合） */
  searchResults?: SearchResult[];
}
