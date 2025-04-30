export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  html?: string; // Markdownから変換されたHTMLコンテンツ
  isMarkdown?: boolean; // コンテンツがMarkdown形式かどうかを示すフラグ
  isLoading?: boolean; // 処理中のメッセージかどうかを示すフラグ
}
