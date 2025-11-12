'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RootKeywordCard } from './root-keyword-card';
import type { RootAnalysisResponse, RootAnalysisResult } from '@/types/keyword-analysis';

interface RootAnalysisTabProps {
  data: RootAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  onExportRoot: (root: RootAnalysisResult) => void;
}

type SortOption = 'alphabetical' | 'members' | 'volume' | 'frequency';

export function RootAnalysisTab({ data, isLoading, error, onExportRoot }: RootAnalysisTabProps) {
  const hasResults = !!data && Array.isArray(data.results) && data.results.length > 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('members');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const summary = useMemo(() => {
    if (!hasResults || !data) return null;
    const totalRoots = data.results.length;
    const totalMembers = data.results.reduce((acc, root) => acc + root.members.length, 0);
    return { totalRoots, totalMembers };
  }, [data, hasResults]);

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    if (!hasResults || !data) return [];

    let results = [...data.results];

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      results = results.filter(root =>
        root.normalized_term.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    results.sort((a, b) => {
      switch (sortOption) {
        case 'alphabetical':
          return a.normalized_term.localeCompare(b.normalized_term);
        case 'members':
          return b.members.length - a.members.length;
        case 'volume':
          return (b.search_volume ?? 0) - (a.search_volume ?? 0);
        case 'frequency':
          return b.frequency - a.frequency;
        default:
          return 0;
      }
    });

    return results;
  }, [data, hasResults, debouncedSearchQuery, sortOption]);

  const itemRenderer = useCallback((index: number, root: RootAnalysisResult) => (
    <div className="pb-4">
      <RootKeywordCard
        key={root.normalized_term}
        root={root}
        onExportRoot={onExportRoot}
      />
    </div>
  ), [onExportRoot]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Root Keywords</CardTitle>
        <CardDescription>
          Aggregated root phrases derived from your upload. Each root lists contributing keywords and volume totals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating root analysis…
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && !hasResults && (
          <p className="text-sm text-muted-foreground">
            Root analysis results will appear here once available.
          </p>
        )}

        {summary && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium">{summary.totalRoots.toLocaleString()} root terms</span>
            <span className="text-muted-foreground">{summary.totalMembers.toLocaleString()} member keywords</span>
          </div>
        )}

        {hasResults && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search root keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="members">Most Members</SelectItem>
                  <SelectItem value="volume">Highest Volume</SelectItem>
                  <SelectItem value="frequency">Highest Frequency</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {debouncedSearchQuery && (
              <div className="text-sm text-muted-foreground">
                {filteredAndSortedResults.length === 0 ? (
                  'No results found'
                ) : (
                  `Showing ${filteredAndSortedResults.length} of ${summary?.totalRoots} root terms`
                )}
              </div>
            )}

            <div className="relative min-h-[400px]" style={{ height: 'calc(100vh - 500px)', maxHeight: '800px' }}>
              <Virtuoso
                data={filteredAndSortedResults}
                itemContent={itemRenderer}
                overscan={3}
                style={{ height: '100%' }}
                className="scrollbar-thin"
                increaseViewportBy={{ top: 100, bottom: 100 }}
              />
            </div>
          </div>
        )}

        {data?.auto_config_updates && (data.auto_config_updates.new_stopwords?.length || Object.keys(data.auto_config_updates.new_irregular_singulars ?? {}).length) ? (
          <div className="rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Backend suggestions</p>
            {data.auto_config_updates.new_stopwords?.length ? (
              <p>New stopwords: {data.auto_config_updates.new_stopwords.join(', ')}</p>
            ) : null}
            {data.auto_config_updates.new_irregular_singulars && Object.keys(data.auto_config_updates.new_irregular_singulars).length ? (
              <p>
                Irregular singulars: {Object.entries(data.auto_config_updates.new_irregular_singulars)
                  .map(([plural, singular]) => `${plural} → ${singular}`)
                  .join(', ')}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

