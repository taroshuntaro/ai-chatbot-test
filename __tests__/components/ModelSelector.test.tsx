import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ModelSelector from "@/components/ModelSelector";
import {
  AVAILABLE_MODELS,
  MODEL_DISPLAY_NAMES,
  OpenAIModel,
} from "@/types/model";
import "@testing-library/jest-dom";

describe("ModelSelector コンポーネント", () => {
  // テスト用のprops
  const mockProps = {
    selectedModel: "gpt-4o-mini" as OpenAIModel,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("コンポーネントが正しくレンダリングされること", () => {
    render(<ModelSelector {...mockProps} />);

    // ラベルが表示されていることを確認
    const label = screen.getByText("モデル:");
    expect(label).toBeInTheDocument();

    // セレクトボックスが存在することを確認
    const selectBox = screen.getByRole("combobox");
    expect(selectBox).toBeInTheDocument();

    // 選択されているモデルが正しいことを確認
    expect(selectBox).toHaveValue(mockProps.selectedModel);
  });

  it("すべての利用可能なモデルがオプションとして表示されること", () => {
    render(<ModelSelector {...mockProps} />);

    // 利用可能なすべてのモデルがオプションとして表示されていることを確認
    AVAILABLE_MODELS.forEach((model) => {
      const option = screen.getByText(MODEL_DISPLAY_NAMES[model]);
      expect(option).toBeInTheDocument();
    });
  });

  it("モデルが変更されると、onChange関数が呼ばれること", () => {
    render(<ModelSelector {...mockProps} />);

    // セレクトボックスの値を変更
    const selectBox = screen.getByRole("combobox");
    fireEvent.change(selectBox, { target: { value: "gpt-3.5-turbo" } });

    // onChange関数が正しく呼ばれたことを確認
    expect(mockProps.onChange).toHaveBeenCalledWith("gpt-3.5-turbo");
  });
});
