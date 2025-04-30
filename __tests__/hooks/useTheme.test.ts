import { renderHook, act } from "@testing-library/react";
import { useTheme } from "@/hooks/useTheme";

// localStorageのモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// documentのモック
const mockClassList = {
  add: jest.fn(),
  remove: jest.fn(),
};

const mockDocumentElement = {
  classList: mockClassList,
  setAttribute: jest.fn(),
};

describe("useTheme フック", () => {
  // 実際のdocumentを保存
  const originalDocument = global.document;
  const originalLocalStorage = global.localStorage;

  beforeAll(() => {
    // window.documentを部分的にモック
    Object.defineProperty(global.document, "documentElement", {
      value: mockDocumentElement,
      writable: true,
    });

    // localStorageをモック
    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterAll(() => {
    // テスト後に元の値を復元
    global.document = originalDocument;
    global.localStorage = originalLocalStorage;
  });

  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  // mounted状態のテストを修正（テスト環境ではすぐにマウントされるため）
  it("useEffectが実行されると、mountedがtrueになること", () => {
    const { result } = renderHook(() => useTheme());

    // テスト環境ではuseEffectがすぐに実行されるため、mountedはtrueになる
    expect(result.current.mounted).toBe(true);
  });

  it("初期ロード時にlocalStorageからテーマを取得すること", () => {
    // localStorage にテーマが保存されている場合を想定
    mockLocalStorage.getItem.mockReturnValueOnce("dark");

    // useEffectを実行させるためにレンダリング
    const { result } = renderHook(() => useTheme());

    // useEffectが実行されたことを確認
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("theme");

    // テーマがlocalStorageから取得した値に設定されていることを確認
    expect(result.current.theme).toBe("dark");
  });

  it("localStorageに値がない場合はデフォルトでlightテーマが使用されること", () => {
    // localStorage に値がない場合を想定
    mockLocalStorage.getItem.mockReturnValueOnce(null);

    const { result } = renderHook(() => useTheme());

    // デフォルトのlightテーマが設定されていることを確認
    expect(result.current.theme).toBe("light");
  });

  it("toggleTheme関数が呼ばれるとテーマが切り替わること", () => {
    // 初期状態はlight
    mockLocalStorage.getItem.mockReturnValueOnce("light");

    const { result } = renderHook(() => useTheme());

    // 初期テーマがlightであることを確認
    expect(result.current.theme).toBe("light");

    // toggleTheme関数を実行
    act(() => {
      result.current.toggleTheme();
    });

    // テーマがdarkに切り替わったことを確認
    expect(result.current.theme).toBe("dark");

    // localStorageに新しいテーマが保存されたことを確認
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("theme", "dark");

    // documentのクラスとdata属性が更新されたことを確認
    expect(mockDocumentElement.classList.add).toHaveBeenCalledWith("dark");
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith(
      "data-theme",
      "dark"
    );
  });

  it("darkテーマからlightテーマに切り替わること", () => {
    // 初期状態はdark
    mockLocalStorage.getItem.mockReturnValueOnce("dark");

    const { result } = renderHook(() => useTheme());

    // 初期テーマがdarkであることを確認
    expect(result.current.theme).toBe("dark");

    // toggleTheme関数を実行
    act(() => {
      result.current.toggleTheme();
    });

    // テーマがlightに切り替わったことを確認
    expect(result.current.theme).toBe("light");

    // localStorageに新しいテーマが保存されたことを確認
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("theme", "light");

    // documentのclassListからdarkが削除されたことを確認
    expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith("dark");
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith(
      "data-theme",
      "light"
    );
  });
});
