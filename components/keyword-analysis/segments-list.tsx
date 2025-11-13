"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { Edit2, Trash2, ChevronDown, ChevronUp, Plus, Download, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Segment, GroupedKeywordResult } from "@/types/keyword-analysis";

interface SegmentsListProps {
  segments: Segment[];
  groups: GroupedKeywordResult[];
  onEditSegment: (segment: Segment) => void;
  onDeleteSegment: (segmentId: string) => void;
  onAddToSegment: (segmentId: string) => void;
  onExportSegment: (segment: Segment) => void;
  onRemoveKeywordFromSegment: (segmentId: string, keyword: string) => void;
}

interface SegmentCardProps {
  segment: Segment;
  keywordLookup: Map<string, number | undefined>;
  onEdit: () => void;
  onDelete: () => void;
  onAddMore: () => void;
  onExport: () => void;
  onRemoveKeyword: (keyword: string) => void;
}

const SegmentCard = memo(function SegmentCard({
  segment,
  keywordLookup,
  onEdit,
  onDelete,
  onAddMore,
  onExport,
  onRemoveKeyword,
}: SegmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY = 20;
  const [displayedCount, setDisplayedCount] = useState(INITIAL_DISPLAY);

  // Calculate total search volume for the segment
  const totalSearchVolume = useMemo(() => {
    return segment.keywords.reduce((total, keyword) => {
      const volume = keywordLookup.get(keyword);
      return total + (volume || 0);
    }, 0);
  }, [segment.keywords, keywordLookup]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleLoadMore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDisplayedCount((prev) => Math.min(prev + 50, segment.keywords.length));
  }, [segment.keywords.length]);

  const visibleKeywords = isExpanded
    ? segment.keywords.slice(0, displayedCount)
    : segment.keywords.slice(0, INITIAL_DISPLAY);
  const hasMore = segment.keywords.length > displayedCount;

  if (!isExpanded) {
    // Collapsed view
    return (
      <div
        className="rounded-lg border p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-4">
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold mb-2 truncate">
              {segment.name}
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">
                  {segment.keywords.length}
                </span>{" "}
                keyword{segment.keywords.length !== 1 ? "s" : ""}
              </span>
              <span>
                <span className="font-medium text-foreground">
                  {totalSearchVolume.toLocaleString()}
                </span>{" "}
                total volume
              </span>
              <span>
                Created{" "}
                {new Date(segment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAddMore();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="rounded-lg border shadow-sm">
      <div
        className="p-4 cursor-pointer hover:bg-accent/20 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-4">
          <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold mb-2 truncate">
              {segment.name}
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">
                  {segment.keywords.length}
                </span>{" "}
                keyword{segment.keywords.length !== 1 ? "s" : ""}
              </span>
              <span>
                <span className="font-medium text-foreground">
                  {totalSearchVolume.toLocaleString()}
                </span>{" "}
                total volume
              </span>
              <span>
                Created{" "}
                {new Date(segment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAddMore();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-md border bg-muted/40 divide-y">
          {visibleKeywords.map((keyword, index) => {
            const searchVolume = keywordLookup.get(keyword);
            return (
              <div
                key={keyword}
                className={`flex items-center justify-between px-3 py-2 text-sm ${
                  index % 2 === 0 ? "bg-muted/20" : ""
                }`}
              >
                <span className="font-medium truncate flex-1">{keyword}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground text-xs">
                    {searchVolume !== undefined
                      ? `Volume: ${searchVolume.toLocaleString()}`
                      : "Volume: —"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveKeyword(keyword);
                    }}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                className="w-full"
              >
                Load {Math.min(50, segment.keywords.length - displayedCount)} more
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export function SegmentsList({
  segments,
  groups,
  onEditSegment,
  onDeleteSegment,
  onAddToSegment,
  onExportSegment,
  onRemoveKeywordFromSegment,
}: SegmentsListProps) {
  // Create lookup map for keyword -> search volume
  const keywordLookup = useMemo(() => {
    const lookup = new Map<string, number | undefined>();
    groups.forEach((group) => {
      lookup.set(group.parent.keyword, group.parent.searchVolume);
    });
    return lookup;
  }, [groups]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Created Segments</CardTitle>
        <CardDescription>
          {segments.length === 0
            ? "No segments created yet"
            : `${segments.length} segment${segments.length !== 1 ? "s" : ""} created`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {segments.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center">
              Select keywords from the left panel to create your first segment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {segments.map((segment) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                keywordLookup={keywordLookup}
                onEdit={() => onEditSegment(segment)}
                onDelete={() => onDeleteSegment(segment.id)}
                onAddMore={() => onAddToSegment(segment.id)}
                onExport={() => onExportSegment(segment)}
                onRemoveKeyword={(keyword) => onRemoveKeywordFromSegment(segment.id, keyword)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
