declare module "duckduckgo-search" {
  interface DuckDuckGoSearchResult {
    title: string;
    url: string;
    description: string;
    [key: string]: any;
  }

  interface SearchOptions {
    max?: number;
    region?: string;
    safeSearch?: string;
    time?: string;
    [key: string]: any;
  }

  // duckDuckGoSearch関数の型定義
  export function duckDuckGoSearch(
    query: string,
    options?: SearchOptions
  ): Promise<DuckDuckGoSearchResult[]>;

  export function text(query: string, arg1: string, arg2: string) {
    throw new Error("Function not implemented.");
  }
}
