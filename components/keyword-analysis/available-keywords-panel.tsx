"use client";

import { useState, useMemo, useCallback } from "react";
import { Virtuoso } from "react-virtuoso";
import { Search, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreFilterMultiSelect } from "./score-filter-multi-select";
import { KeywordTagInput } from "./keyword-tag-input";
import type { GroupedKeywordResult } from "@/types/keyword-analysis";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface AvailableKeywordsPanelProps {
  availableKeywords: GroupedKeywordResult[];
  selectedKeywords: Set<string>;
  onSelectionChange: (keywords: Set<string>) => void;
  onCreateSegment: () => void;
}

export function AvailableKeywordsPanel({
  availableKeywords,
  selectedKeywords,
  onSelectionChange,
  onCreateSegment,
}: AvailableKeywordsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string[]>(["all"]);
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Check if any filters are active
  const hasActiveFilters = typeFilter !== "all" ||
    !scoreFilter.includes("all") ||
    includeKeywords.length > 0 ||
    excludeKeywords.length > 0;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setTypeFilter("all");
    setScoreFilter(["all"]);
    setIncludeKeywords([]);
    setExcludeKeywords([]);
    setSearchTerm("");
  }, []);

  // Filter keywords based on all filters
  const filteredKeywords = useMemo(() => {
    let filtered = [...availableKeywords];

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((group) => group.parent.type === typeFilter);
    }

    // Score filter
    if (!scoreFilter.includes("all")) {
      filtered = filtered.filter((group) => {
        const score = group.parent.score;
        if (scoreFilter.includes("high") && score >= 8 && score <= 10) return true;
        if (scoreFilter.includes("medium") && score >= 5 && score < 8) return true;
        if (scoreFilter.includes("low") && score >= 1 && score < 5) return true;
        return false;
      });
    }

    // Include keywords filter (AND logic - match all in keyword text)
    if (includeKeywords.length > 0) {
      filtered = filtered.filter((group) => {
        const keywordLower = group.parent.keyword.toLowerCase();
        return includeKeywords.every((keyword) => {
          const searchLower = keyword.toLowerCase();
          return keywordLower.includes(searchLower);
        });
      });
    }

    // Exclude keywords filter (OR logic - exclude if any match in keyword text)
    if (excludeKeywords.length > 0) {
      filtered = filtered.filter((group) => {
        const keywordLower = group.parent.keyword.toLowerCase();
        return !excludeKeywords.some((keyword) => {
          const searchLower = keyword.toLowerCase();
          return keywordLower.includes(searchLower);
        });
      });
    }

    // Search filter
    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase();
      filtered = filtered.filter((group) =>
        group.parent.keyword.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }, [availableKeywords, typeFilter, scoreFilter, includeKeywords, excludeKeywords, debouncedSearch]);

  const toggleKeyword = useCallback(
    (keyword: string) => {
      const newSelection = new Set(selectedKeywords);
      if (newSelection.has(keyword)) {
        newSelection.delete(keyword);
      } else {
        newSelection.add(keyword);
      }
      onSelectionChange(newSelection);
    },
    [selectedKeywords, onSelectionChange]
  );

  const clearSelection = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const selectAllVisible = useCallback(() => {
    const newSelection = new Set(selectedKeywords);
    filteredKeywords.forEach((group) => {
      newSelection.add(group.parent.keyword);
    });
    onSelectionChange(newSelection);
  }, [filteredKeywords, selectedKeywords, onSelectionChange]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Available Keywords</CardTitle>
            <CardDescription>
              Select parent keywords to create a segment
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters || debouncedSearch ? (
              <>
                {filteredKeywords.length} of {availableKeywords.length} shown
              </>
            ) : (
              <>{availableKeywords.length} available</>
            )}
            {selectedKeywords.size > 0 && (
              <span className="ml-2">
                ({selectedKeywords.size} selected)
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* First row: Type and Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="generic">Generic</SelectItem>
                  <SelectItem value="our_brand">Our Brand</SelectItem>
                  <SelectItem value="competitor_brand">Competitor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Score Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Score</label>
              <ScoreFilterMultiSelect
                selectedScores={scoreFilter}
                onScoreChange={setScoreFilter}
              />
            </div>
          </div>

          {/* Second row: Include and Exclude */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Include Keywords */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Include</label>
              <KeywordTagInput
                placeholder="Add keywords to include..."
                tags={includeKeywords}
                onAddTag={(tag) => setIncludeKeywords([...includeKeywords, tag])}
                onRemoveTag={(tag) => setIncludeKeywords(includeKeywords.filter((k) => k !== tag))}
              />
            </div>

            {/* Exclude Keywords */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Exclude</label>
              <KeywordTagInput
                placeholder="Add keywords to exclude..."
                tags={excludeKeywords}
                onAddTag={(tag) => setExcludeKeywords([...excludeKeywords, tag])}
                onRemoveTag={(tag) => setExcludeKeywords(excludeKeywords.filter((k) => k !== tag))}
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            onClick={clearAllFilters}
            variant="outline"
            size="sm"
            className="gap-2 self-start"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onCreateSegment}
            disabled={selectedKeywords.size === 0}
            size="sm"
          >
            Create Segment ({selectedKeywords.size})
          </Button>

          {selectedKeywords.size > 0 && (
            <Button
              onClick={clearSelection}
              variant="ghost"
              size="sm"
            >
              Clear Selection
            </Button>
          )}

          {filteredKeywords.length > 0 &&
            selectedKeywords.size !== filteredKeywords.length && (
              <Button
                onClick={selectAllVisible}
                variant="ghost"
                size="sm"
              >
                Select All Visible
              </Button>
            )}
        </div>

        {/* Keywords list */}
        {availableKeywords.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              No available keywords. All parent keywords have been assigned to segments.
            </p>
          </div>
        ) : filteredKeywords.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              No keywords match your search.
            </p>
          </div>
        ) : (
          <div className="flex-1 rounded-lg border bg-muted/40 overflow-hidden">
            <Virtuoso
              style={{ height: "100%" }}
              data={filteredKeywords}
              itemContent={(index, group) => {
                const keyword = group.parent.keyword;
                const isSelected = selectedKeywords.has(keyword);

                return (
                  <div
                    key={keyword}
                    className={`
                      flex items-center gap-3 px-4 py-3 cursor-pointer
                      transition-colors hover:bg-accent/50 border-b last:border-b-0
                      ${isSelected ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
                    `}
                    onClick={() => toggleKeyword(keyword)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleKeyword(keyword)}
                      onClick={(e) => e.stopPropagation()}
                      className={isSelected ? "border-white" : ""}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{keyword}</div>
                      <div className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                        {group.parent.searchVolume ? (
                          <span>Search Volume: {group.parent.searchVolume.toLocaleString()}</span>
                        ) : null}
                        {group.parent.searchVolume && group.parent.score && (
                          <span className="mx-2">|</span>
                        )}
                        {group.parent.score && (
                          <span>Score: {group.parent.score.toFixed(1)}</span>
                        )}
                        {group.totalVariations > 1 && (
                          <span className="ml-2">
                            | {group.totalVariations} variations
                          </span>
                        )}
                      </div>
                    </div>

                    {group.parent.type !== "generic" && (
                      <Badge
                        variant={isSelected ? "outline" : "secondary"}
                        className={isSelected ? "border-white text-white" : ""}
                      >
                        {group.parent.type === "our_brand" ? "Our Brand" : "Competitor"}
                      </Badge>
                    )}
                  </div>
                );
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
