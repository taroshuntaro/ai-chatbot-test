/**
 * Web検索結果表示コンポーネント
 *
 * AIが外部情報を使用した場合に、参照した検索結果を表示します
 * 各検索結果はクリック可能なリンクとして表示されます
 */
import { FC } from "react";
import { SearchResult } from "@/types/message";

interface SearchResultsDisplayProps {
  results: SearchResult[];
}

export const SearchResultsDisplay: FC<SearchResultsDisplayProps> = ({
  results,
}) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="mt-3 border-t pt-3 border-gray-300 dark:border-gray-500">
      <h4 className="font-semibold mb-2">Web検索結果:</h4>
      <div className="space-y-3">
        {results.map((result, idx) => (
          <div
            key={idx}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
          >
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h5 className="text-sm font-bold underline">{result.title}</h5>
              <p className="text-xs opacity-90">{result.description}</p>
              <p className="text-xs italic mt-1 opacity-70">{result.url}</p>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
