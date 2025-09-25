'use client';

import { useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RootKeywordCard } from './root-keyword-card';
import type { RootAnalysisResponse, RootAnalysisResult } from '@/types/keyword-analysis';

interface RootAnalysisTabProps {
  data: RootAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  onExportRoot: (root: RootAnalysisResult) => void;
}

export function RootAnalysisTab({ data, isLoading, error, onExportRoot }: RootAnalysisTabProps) {
  const hasResults = !!data && Array.isArray(data.results) && data.results.length > 0;

  const summary = useMemo(() => {
    if (!hasResults || !data) return null;
    const totalRoots = data.results.length;
    const totalMembers = data.results.reduce((acc, root) => acc + root.members.length, 0);
    return { totalRoots, totalMembers };
  }, [data, hasResults]);

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
          <div className="relative min-h-[400px]" style={{ height: 'calc(100vh - 400px)', maxHeight: '800px' }}>
            <Virtuoso
              data={data!.results}
              itemContent={itemRenderer}
              overscan={3}
              style={{ height: '100%' }}
              className="scrollbar-thin"
              increaseViewportBy={{ top: 100, bottom: 100 }}
            />
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

