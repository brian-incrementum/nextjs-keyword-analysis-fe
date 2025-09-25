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
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleMembers = isExpanded ? root.members.slice(0, displayedMembers) : root.members.slice(0, INITIAL_MEMBERS_DISPLAY);
  const hasMoreMembers = root.members.length > displayedMembers;
  const canExpand = root.members.length > INITIAL_MEMBERS_DISPLAY;

  const handleLoadMore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDisplayedMembers(prev => Math.min(prev + LOAD_MORE_INCREMENT, root.members.length));
  }, [root.members.length]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
    if (!isExpanded && displayedMembers === INITIAL_MEMBERS_DISPLAY) {
      setDisplayedMembers(Math.min(INITIAL_MEMBERS_DISPLAY + LOAD_MORE_INCREMENT, root.members.length));
    }
  }, [isExpanded, displayedMembers, root.members.length]);

  const handleExport = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExportRoot(root);
  }, [root, onExportRoot]);

  return (
    <div className="rounded-lg border p-4 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="md:w-1/2 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">{root.normalized_term}</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <dt className="font-medium text-foreground">Frequency</dt>
              <dd>{formatNumber(root.frequency)}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Search Volume</dt>
              <dd>{formatNumber(root.search_volume)}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Relative Volume</dt>
              <dd>{formatPercentage(root.relative_volume)}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Members</dt>
              <dd>{root.members.length.toLocaleString()}</dd>
            </div>
          </dl>
        </div>
        <div className="md:w-1/2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Member Keywords
            </h4>
            {canExpand && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="h-6 px-2 text-xs"
              >
                {isExpanded ? (
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
            {isExpanded && hasMoreMembers && (
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