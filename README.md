# AI チャットボット

このプロジェクトは個人の学習目的かつ、**昨今のコーディングアシスタントの Agent 機能ってどんなものなのかな**、と思い作成した OpenAI API を活用した AI チャットボットアプリケーションです。Next.js、React、TypeScript と Tailwind CSS を使用して構築されています。

**注意**: このリポジトリは学習および実験目的で作成されたものであり、商用利用を意図したものではありません。

（README も 9.9 割 Github Copilot を使用し作成）

## 主な機能

- OpenAI API（GPT-4o-mini）を使用した AI チャットボット機能
- DuckDuckGo 検索 API による最新情報の取得・補完機能
- レスポンシブなデザイン
- ダークモード/ライトモードの切り替え
- レート制限機能（DoS 対策、コスト制御）
- マークダウン形式によるリッチテキスト応答
- モダンな UI/UX デザイン

## セットアップ手順

1. リポジトリをクローンします。

2. 必要な依存関係をインストールします。

   ```bash
   npm install
   ```

3. 環境変数を設定します。`.env.example`ファイルをコピーし`.env`ファイルを作成し、以下の変数を設定します。

   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

4. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

5. ブラウザで以下の URL を開きます。

   ```
   http://localhost:3000
   ```

## 技術スタック

- **Next.js 15.3.1**: React ベースの最新フレームワーク（Turbopack 対応）
- **React 19**: UI コンポーネントライブラリ
- **TypeScript 5**: 型安全な JavaScript
- **Tailwind CSS 3.3**: ユーティリティファーストの CSS フレームワーク
- **OpenAI API**: AI モデルとの対話機能（GPT-4o-mini 使用）
- **DuckDuckGo Search API**: Web 検索による最新情報の補完
- **ESLint 9**: コード品質管理ツール
- **Marked & DOMPurify**: マークダウン変換とサニタイズ

## プロジェクト構造

- `app/`: Next.js の App Router を使用したアプリケーションの主要部分
  - `page.tsx`: メインのチャットインターフェース
  - `layout.tsx`: アプリケーションのレイアウト
  - `api/`: バックエンド API
    - `openai/`: OpenAI API 連携と Web 検索統合
  - `utils/`: レート制限などのユーティリティ関数
- `components/`: 再利用可能な React コンポーネント
  - `MessageList.tsx`: チャットメッセージの表示
  - `InputBar.tsx`: ユーザー入力フォーム
  - `Header.tsx`: アプリケーションヘッダー
  - `Footer.tsx`: アプリケーションフッター
  - `ThemeToggleButton.tsx`: テーマ切り替えボタン
- `hooks/`: カスタム React フック（テーマ切り替えなど）
- `styles/`: グローバルスタイル定義（Tailwind CSS）
- `types/`: TypeScript 型定義
- `utils/`: アプリケーション全体で使用されるユーティリティ関数
  - `openaiApi.ts`: OpenAI API クライアント機能

## 主要な実装詳細

### AI チャットボット機能

- GPT-4o-mini モデルを使用した自然言語処理
- ユーザープロンプトに対する応答生成
- マークダウン形式のリッチテキスト応答

### Web 検索による情報補完

- DuckDuckGo の Search API を利用した最新情報の検索
- AI の知識が不足している場合に自動的に Web 検索を実行
- 検索結果を考慮した最終応答の生成

### セキュリティと安定性

- 入力のサニタイズによるセキュリティ強化
- レート制限による DoS 攻撃対策とコスト制御
- エラーハンドリングとタイムアウト処理の実装

### UI/UX

- レスポンシブデザイン（モバイル対応）
- ダークモード/ライトモードのテーマ切り替え
- ローディング状態の表示

## 将来の拡張予定

- 会話履歴の保存機能
- 複数 AI モデルの切り替え機能
