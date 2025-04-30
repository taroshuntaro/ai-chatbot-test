"use client";

import { useState, useCallback } from "react";
import MessageList from "../components/MessageList";
import InputBar from "../components/InputBar";

export interface Message {
  sender: "bot" | "user";
  text: string;
  id: string; // メッセージのユニークID
}

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "こんにちは！何をお手伝いしましょうか？",
      id: "welcome-message",
    },
  ]);
  const [input, setInput] = useState<string>("");

  // 新しいメッセージIDを生成する関数
  const generateMessageId = useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const handleSend = useCallback(() => {
    if (input.trim() === "") return;

    const currentInput = input.trim();
    setInput(""); // 先に入力をクリア

    // ユーザーメッセージ追加
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: currentInput,
        id: generateMessageId(),
      },
    ]);

    // ボットの応答は少し遅延させる
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "お返事を考えています...",
          id: generateMessageId(),
        },
      ]);
    }, 10);
  }, [input, generateMessageId]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200">
      <MessageList messages={messages} />
      <InputBar input={input} setInput={setInput} handleSend={handleSend} />
    </div>
  );
};

export default Home;
