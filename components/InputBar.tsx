"use client";

import { useState, FC, ChangeEvent, KeyboardEvent } from "react";

interface InputBarProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
}

const InputBar: FC<InputBarProps> = ({ input, setInput, handleSend }) => {
  const [isComposing, setIsComposing] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !isComposing && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-white dark:bg-gray-800 shadow-inner flex items-center max-w-screen border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <textarea
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none h-16 bg-white dark:bg-gray-700 text-black dark:text-white"
        placeholder="メッセージを入力..."
        aria-label="メッセージ入力"
      />
      <button
        onClick={handleSend}
        disabled={!input.trim()}
        className={`ml-4 p-3 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-transform transform active:scale-95 ${
          input.trim()
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        }`}
        aria-label="送信"
      >
        送信
      </button>
    </div>
  );
};

export default InputBar;