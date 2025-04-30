import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InputBar from "@/components/InputBar";
import DOMPurify from "dompurify";
import { OpenAIModel } from "@/types/model";
import "@testing-library/jest-dom";

// DOMPurifyをモック
jest.mock("dompurify", () => ({
  sanitize: jest.fn((content) => content),
}));

// ModelSelectorコンポーネントをモック
jest.mock("@/components/ModelSelector", () => {
  return function MockModelSelector({
    selectedModel,
    onChange,
  }: {
    selectedModel: OpenAIModel;
    onChange: (model: OpenAIModel) => void;
  }) {
    return (
      <div data-testid="model-selector">
        <select
          data-testid="mock-model-selector"
          value={selectedModel}
          onChange={(e) => onChange(e.target.value as OpenAIModel)}
        >
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
        </select>
      </div>
    );
  };
});

describe("InputBar コンポーネント", () => {
  // テスト用のprops
  const mockProps = {
    input: "",
    setInput: jest.fn(),
    handleSend: jest.fn(),
    setMessages: jest.fn(),
    selectedModel: "gpt-4o-mini" as OpenAIModel,
    onModelChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("コンポーネントが正しくレンダリングされること", () => {
    render(<InputBar {...mockProps} />);

    // テキストエリアが存在することを確認
    const textarea = screen.getByRole("textbox", { name: /メッセージ入力/i });
    expect(textarea).toBeInTheDocument();

    // 送信ボタンが存在することを確認
    const button = screen.getByRole("button", { name: /送信/i });
    expect(button).toBeInTheDocument();

    // モデルセレクターが存在することを確認
    const modelSelector = screen.getByTestId("model-selector");
    expect(modelSelector).toBeInTheDocument();
  });

  it("入力値が変更されると、setInput関数が呼ばれること", () => {
    render(<InputBar {...mockProps} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "テストメッセージ" } });

    expect(mockProps.setInput).toHaveBeenCalledWith("テストメッセージ");
    expect(DOMPurify.sanitize).toHaveBeenCalledWith("テストメッセージ", {
      ALLOWED_TAGS: [],
    });
  });

  it("送信ボタンがクリックされると、handleSend関数が呼ばれること", () => {
    const props = {
      ...mockProps,
      input: "テストメッセージ",
    };

    render(<InputBar {...props} />);

    const button = screen.getByRole("button", { name: /送信/i });
    fireEvent.click(button);

    expect(mockProps.handleSend).toHaveBeenCalledTimes(1);
  });

  it("入力が空の場合、送信ボタンが無効化されていること", () => {
    render(<InputBar {...mockProps} />);

    const button = screen.getByRole("button", { name: /送信/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("bg-gray-300");
  });

  it("入力がある場合、送信ボタンが有効化されていること", () => {
    const props = {
      ...mockProps,
      input: "テストメッセージ",
    };

    render(<InputBar {...props} />);

    const button = screen.getByRole("button", { name: /送信/i });
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass("bg-blue-500");
  });

  it("Enter キーが押されると、handleSend関数が呼ばれること", () => {
    const props = {
      ...mockProps,
      input: "テストメッセージ",
    };

    render(<InputBar {...props} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

    expect(mockProps.handleSend).toHaveBeenCalledTimes(1);
  });

  it("Shift+Enter キーが押されても、handleSend関数が呼ばれないこと", () => {
    const props = {
      ...mockProps,
      input: "テストメッセージ",
    };

    render(<InputBar {...props} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, {
      key: "Enter",
      code: "Enter",
      shiftKey: true,
    });

    expect(mockProps.handleSend).not.toHaveBeenCalled();
  });

  it("IME入力中にEnterキーが押されても、handleSend関数が呼ばれないこと", () => {
    const props = {
      ...mockProps,
      input: "テストメッセージ",
    };

    render(<InputBar {...props} />);

    const textarea = screen.getByRole("textbox");

    // IME入力開始イベントをシミュレート
    fireEvent.compositionStart(textarea);

    // IME入力中にEnterキーを押す
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

    expect(mockProps.handleSend).not.toHaveBeenCalled();

    // IME入力終了イベントをシミュレート
    fireEvent.compositionEnd(textarea);

    // IME入力終了後にEnterキーを押す
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

    expect(mockProps.handleSend).toHaveBeenCalledTimes(1);
  });

  it("入力が最大文字数を超えた場合、制限されること", () => {
    // MAX_INPUT_LENGTHは1000に設定されていることが前提
    const longText = "a".repeat(1200);
    const expectedText = "a".repeat(1000);

    // DOMPurifyのモックを一時的に上書きして、元のロジックを再現
    (DOMPurify.sanitize as jest.Mock).mockImplementationOnce((text) => {
      return text;
    });

    render(<InputBar {...mockProps} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: longText } });

    // setInputが呼ばれた際、値が制限されていることを確認
    expect(mockProps.setInput).toHaveBeenCalledWith(expect.any(String));
    expect(mockProps.setInput.mock.calls[0][0].length).toBeLessThanOrEqual(
      1000
    );
  });

  it("モデルが変更されると、onModelChange関数が呼ばれること", () => {
    render(<InputBar {...mockProps} />);

    // モデルセレクターを取得
    const modelSelector = screen.getByTestId("mock-model-selector");

    // モデルを変更
    fireEvent.change(modelSelector, { target: { value: "gpt-3.5-turbo" } });

    // onModelChange関数が正しく呼ばれたことを確認
    expect(mockProps.onModelChange).toHaveBeenCalledWith("gpt-3.5-turbo");
  });
});
