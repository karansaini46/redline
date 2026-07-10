"use client";

import { useState, useEffect } from "react";
import { searchClausesAction } from "@/app/actions/searchActions";
import { SemanticSearchResult } from "@/server/search/semanticSearch";
import { ClauseType } from "@prisma/client";

export function ClauseSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clauseTypeFilter, setClauseTypeFilter] = useState<ClauseType | "ALL">(
    "ALL",
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const filters: { clauseType?: ClauseType } = {};
        if (clauseTypeFilter !== "ALL") {
          filters.clauseType = clauseTypeFilter;
        }

        const res = await searchClausesAction(debouncedQuery, filters);
        setResults(res);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery, clauseTypeFilter]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto p-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="search-input" className="text-sm font-medium">
          Semantic Clause Search
        </label>
        <div className="flex gap-4">
          <input
            id="search-input"
            type="text"
            className="flex-1 p-2 border rounded-md dark:bg-black dark:border-white/[.145] dark:text-white"
            placeholder="e.g. unlimited liability exposure"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="p-2 border rounded-md dark:bg-black dark:border-white/[.145] dark:text-white"
            value={clauseTypeFilter}
            onChange={(e) =>
              setClauseTypeFilter(e.target.value as ClauseType | "ALL")
            }
          >
            <option value="ALL">All Clauses</option>
            {Object.values(ClauseType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading && <p className="text-sm text-gray-500">Searching...</p>}

        {!isLoading && results.length === 0 && debouncedQuery && (
          <p className="text-sm text-gray-500">No clauses found.</p>
        )}

        {!isLoading &&
          results.map((result) => (
            <div
              key={result.id}
              className="p-4 border rounded-md shadow-sm dark:border-white/[.145] relative overflow-hidden flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  {result.clause_type}
                </span>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                  {(result.similarity * 100).toFixed(1)}% Match
                </span>
              </div>

              <p className="text-sm text-gray-800 dark:text-gray-200 mt-2">
                {result.text}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Source: {result.contract_title}
                {result.page_number && ` (Page ${result.page_number})`}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
