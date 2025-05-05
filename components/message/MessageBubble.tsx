/**
 * メッセージバブル表示コンポーネント
 *
 * ユーザー/ボットのメッセージに応じた適切なスタイルでバブルを表示します
 */
import { FC } from "react";
import { Message } from "@/types/message";
import { MessageContent } from "@/components/message/MessageContent";
import { CopyButton } from "@/components/message/CopyButton";

interface MessageBubbleProps {
  message: Message;
  showCopyButton: boolean;
}

export const MessageBubble: FC<MessageBubbleProps> = ({
  message,
  showCopyButton,
}) => {
  // ボットからのメッセージかどうかを判定
  const isBotMessage = message.sender === "bot";

  return (
    <div className="flex flex-col">
      <div
        className={`${
          isBotMessage
            ? "sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl p-4 transition-transform text-gray-800 dark:text-gray-200"
            : "sm:max-w-md md:max-w-lg lg:max-w-xl p-4 rounded-xl shadow-lg transition-transform bg-gray-300 dark:bg-gray-600 text-black dark:text-white"
        } ${message.isMarkdown ? "" : "whitespace-pre-wrap"} hover:shadow-md`}
      >
        <MessageContent message={message} />
      </div>
      <div className="self-end mt-1">
        {showCopyButton && <CopyButton text={message.text} />}
      </div>
    </div>
  );
};
