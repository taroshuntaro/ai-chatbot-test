# AI チャットボット

このプロジェクトは個人の学習目的かつ、**昨今のコーディングアシスタントの Agent 機能ってどんなものなのかな**、と思い作成した OpenAI API を活用した AI チャットボットアプリケーションです。Next.js、React、TypeScript と Tailwind CSS を使用して構築されています。

**注意**: このリポジトリは学習および実験目的で作成されたものであり、商用利用を意図したものではありません。

（README も 9.9 割 Github Copilot を使用し作成）

## 主な機能

- OpenAI API を使用した AI チャットボット機能
- レスポンシブなデザイン
- ダークモード/ライトモードの切り替え
- レート制限機能
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
- **OpenAI API**: AI モデルとの対話機能
- **ESLint 9**: コード品質管理ツール

## プロジェクト構造

- `app/`: Next.js の App Router を使用したアプリケーションの主要部分
  - `api/`: バックエンド API（OpenAI API 連携など）
  - `utils/`: ユーティリティ関数
- `components/`: 再利用可能な React コンポーネント
- `hooks/`: カスタム React フック
- `styles/`: グローバルスタイル定義
- `types/`: TypeScript 型定義
- `utils/`: アプリケーション全体で使用されるユーティリティ関数
