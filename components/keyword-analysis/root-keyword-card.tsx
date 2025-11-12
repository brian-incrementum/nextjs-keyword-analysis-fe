'use client';

import { memo, useState, useCallback } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RootAnalysisResult } from '@/types/keyword-analysis';

interface RootKeywordCardProps {
  root: RootAnalysisResult;
  onExportRoot: (root: RootAnalysisResult) => void;
}

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString();
};

const formatPercentage = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
};

const INITIAL_MEMBERS_DISPLAY = 20;
const LOAD_MORE_INCREMENT = 50;

export const RootKeywordCard = memo(function RootKeywordCard({
  root,
  onExportRoot
}: RootKeywordCardProps) {
  const [displayedMembers, setDisplayedMembers] = useState(INITIAL_MEMBERS_DISPLAY);
  const [isMembersExpanded, setIsMembersExpanded] = useState(false);
  const [isCardCollapsed, setIsCardCollapsed] = useState(true);

  const visibleMembers = isMembersExpanded ? root.members.slice(0, displayedMembers) : root.members.slice(0, INITIAL_MEMBERS_DISPLAY);
  const hasMoreMembers = root.members.length > displayedMembers;
  const canExpandMembers = root.members.length > INITIAL_MEMBERS_DISPLAY;

  const handleLoadMore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDisplayedMembers(prev => Math.min(prev + LOAD_MORE_INCREMENT, root.members.length));
  }, [root.members.length]);

  const toggleMembersExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMembersExpanded(prev => !prev);
    if (!isMembersExpanded && displayedMembers === INITIAL_MEMBERS_DISPLAY) {
      setDisplayedMembers(Math.min(INITIAL_MEMBERS_DISPLAY + LOAD_MORE_INCREMENT, root.members.length));
    }
  }, [isMembersExpanded, displayedMembers, root.members.length]);

  const toggleCardCollapsed = useCallback(() => {
    setIsCardCollapsed(prev => !prev);
  }, []);

  const handleExport = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExportRoot(root);
  }, [root, onExportRoot]);

  if (isCardCollapsed) {
    // Collapsed view: compact display with metrics
    return (
      <div
        className="rounded-lg border p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md cursor-pointer"
        onClick={toggleCardCollapsed}
      >
        <div className="flex items-center gap-4">
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold mb-2 truncate">{root.normalized_term}</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{root.members.length.toLocaleString()}</span> members
              </span>
              <span>
                <span className="font-medium text-foreground">{formatNumber(root.search_volume)}</span> volume
              </span>
              <span>
                <span className="font-medium text-foreground">{formatNumber(root.frequency)}</span> frequency
              </span>
              <span>
                <span className="font-medium text-foreground">{formatPercentage(root.relative_volume)}</span> relative
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="shrink-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Expanded view: full details with member keywords
  return (
    <div
      className="rounded-lg border shadow-sm transition-all"
    >
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={toggleCardCollapsed}
      >
        <div className="flex items-center gap-4">
          <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold mb-2">{root.normalized_term}</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{root.members.length.toLocaleString()}</span> members
              </span>
              <span>
                <span className="font-medium text-foreground">{formatNumber(root.search_volume)}</span> volume
              </span>
              <span>
                <span className="font-medium text-foreground">{formatNumber(root.frequency)}</span> frequency
              </span>
              <span>
                <span className="font-medium text-foreground">{formatPercentage(root.relative_volume)}</span> relative
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="shrink-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 pb-4 pt-0">
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Member Keywords
            </h4>
            {canExpandMembers && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleMembersExpanded}
                className="h-6 px-2 text-xs"
              >
                {isMembersExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" />
                    Show all ({root.members.length})
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 text-sm">
              {visibleMembers.map(member => (
                <Badge
                  key={`${root.normalized_term}-${member.keyword}`}
                  variant="secondary"
                  className="whitespace-nowrap"
                >
                  {member.keyword}
                  {member.search_volume ? ` · ${formatNumber(member.search_volume)}` : ''}
                </Badge>
              ))}
              {root.members.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No keywords associated with this root.
                </span>
              )}
            </div>
            {isMembersExpanded && hasMoreMembers && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                className="w-full h-8 text-xs"
              >
                Load {Math.min(LOAD_MORE_INCREMENT, root.members.length - displayedMembers)} more
                ({displayedMembers} of {root.members.length} shown)
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});