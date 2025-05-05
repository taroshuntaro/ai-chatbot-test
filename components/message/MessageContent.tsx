/**
 * メッセージ内容表示コンポーネント
 *
 * メッセージの種類（通常/ローディング）や形式（マークダウン/プレーンテキスト）に応じて
 * 適切なレンダリング方法を選択します
 */
import { FC } from "react";
import { Message } from "@/types/message";
import { LoadingIndicator } from "@/components/message/LoadingIndicator";
import { SearchResultsDisplay } from "@/components/message/SearchResultsDisplay";

interface MessageContentProps {
  message: Message;
}

export const MessageContent: FC<MessageContentProps> = ({ message }) => {
  // ローディング中の場合はローディングインジケーターを表示
  if (message.isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <>
      <div>
        {/* マークダウン形式の場合はHTMLとして表示、それ以外はテキストとして表示 */}
        {message.isMarkdown && message.html ? (
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: message.html }}
          />
        ) : (
          <div>{message.text}</div>
        )}

        {/* 検索結果がある場合は表示 */}
        {message.searchResults && message.searchResults.length > 0 && (
          <SearchResultsDisplay results={message.searchResults} />
        )}
      </div>
    </>
  );
};
