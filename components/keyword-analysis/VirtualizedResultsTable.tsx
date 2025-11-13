'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowUpDown,
  Search,
  TrendingUp,
  Package,
  Zap,
  Layers,
  List
} from 'lucide-react';
import { ExportDropdown } from '@/components/keyword-analysis/export-dropdown';
import { ScoreFilterMultiSelect } from '@/components/keyword-analysis/score-filter-multi-select';
import { KeywordTagInput } from '@/components/keyword-analysis/keyword-tag-input';
import type { KeywordResult, GroupedKeywordResult } from '@/types/keyword-analysis';

interface VirtualizedResultsTableProps {
  results: KeywordResult[];
  groups: GroupedKeywordResult[];
  onExport: (format: 'csv' | 'xlsx', exportData?: KeywordResult[], mode?: 'flat' | 'grouped' | 'filtered-all' | 'filtered-parents') => void;
  summary?: {
    average_score: number;
    total_keywords: number;
    by_type: {
      generic: number;
      our_brand: number;
      competitor_brand: number;
    };
  };
}

type SortConfig = {
  key: keyof KeywordResult;
  direction: 'asc' | 'desc';
} | null;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function VirtualizedResultsTable({ 
  results, 
  groups,
  onExport, 
  summary 
}: VirtualizedResultsTableProps) {
  console.log(`[TABLE DEBUG] Received ${results.length} results and ${groups.length} groups to display`);
  
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('grouped');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string[]>(['all']);
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [minVolume, setMinVolume] = useState<string>('');
  const [maxVolume, setMaxVolume] = useState<string>('');

  // Debounce the global filter to prevent stuttering
  const debouncedGlobalFilter = useDebounce(globalFilter, 200);
  const debouncedMinVolume = useDebounce(minVolume, 300);
  const debouncedMaxVolume = useDebounce(maxVolume, 300);

  // Apply filters and sorting
  const processedData = useMemo(() => {
    let filtered = [...results];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Apply score filter
    if (!scoreFilter.includes('all') && scoreFilter.length > 0) {
      filtered = filtered.filter(item => {
        if (scoreFilter.includes('high') && item.score >= 8) return true;
        if (scoreFilter.includes('medium') && item.score >= 5 && item.score <= 7) return true;
        if (scoreFilter.includes('low') && item.score <= 4) return true;
        return false;
      });
    }
    
    // Apply global filter (debounced)
    if (debouncedGlobalFilter) {
      const searchTerm = debouncedGlobalFilter.toLowerCase();
      filtered = filtered.filter(item => 
        item.keyword.toLowerCase().includes(searchTerm) ||
        item.reasoning?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply include keywords filter - item must contain all include keywords
    if (includeKeywords.length > 0) {
      filtered = filtered.filter(item => {
        const keywordLower = item.keyword.toLowerCase();
        return includeKeywords.every((keyword) => {
          const searchLower = keyword.toLowerCase();
          return keywordLower.includes(searchLower);
        });
      });
    }

    // Apply exclude keywords filter - item must not contain any exclude keyword
    if (excludeKeywords.length > 0) {
      filtered = filtered.filter(item => {
        const keywordLower = item.keyword.toLowerCase();
        return !excludeKeywords.some((keyword) => {
          const searchLower = keyword.toLowerCase();
          return keywordLower.includes(searchLower);
        });
      });
    }

    // Apply search volume range filter
    const minVol = debouncedMinVolume ? parseFloat(debouncedMinVolume) : null;
    const maxVol = debouncedMaxVolume ? parseFloat(debouncedMaxVolume) : null;

    if (minVol !== null && !isNaN(minVol)) {
      filtered = filtered.filter(item =>
        item.searchVolume !== undefined && item.searchVolume >= minVol
      );
    }

    if (maxVol !== null && !isNaN(maxVol)) {
      filtered = filtered.filter(item =>
        item.searchVolume !== undefined && item.searchVolume <= maxVol
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [results, typeFilter, scoreFilter, debouncedGlobalFilter, sortConfig, includeKeywords, excludeKeywords, debouncedMinVolume, debouncedMaxVolume]);

  // Apply filters to groups (used for both display and export)
  const filteredGroups = useMemo(() => {
    let filtered = groups;
    if (typeFilter !== 'all') {
      filtered = filtered.filter(g => g.parent.type === typeFilter);
    }
    if (!scoreFilter.includes('all') && scoreFilter.length > 0) {
      filtered = filtered.filter(g => {
        if (scoreFilter.includes('high') && g.parent.score >= 8) return true;
        if (scoreFilter.includes('medium') && g.parent.score >= 5 && g.parent.score <= 7) return true;
        if (scoreFilter.includes('low') && g.parent.score <= 4) return true;
        return false;
      });
    }
    if (debouncedGlobalFilter) {
      const searchTerm = debouncedGlobalFilter.toLowerCase();
      filtered = filtered.filter(g =>
        g.parent.keyword.toLowerCase().includes(searchTerm) ||
        g.parent.reasoning?.toLowerCase().includes(searchTerm) ||
        g.variations.some(v =>
          v.keyword.toLowerCase().includes(searchTerm) ||
          v.reasoning?.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Apply include keywords filter to groups
    if (includeKeywords.length > 0) {
      filtered = filtered.filter(g => {
        const keywordLower = g.parent.keyword.toLowerCase();
        return includeKeywords.every((keyword) => {
          const searchLower = keyword.toLowerCase();
          return keywordLower.includes(searchLower);
        });
      });
    }

    // Apply exclude keywords filter to groups
    if (excludeKeywords.length > 0) {
      filtered = filtered.filter(g => {
        const keywordLower = g.parent.keyword.toLowerCase();
        return !excludeKeywords.some((keyword) => {
          const searchLower = keyword.toLowerCase();
          return keywordLower.includes(searchLower);
        });
      });
    }

    // Apply search volume range filter to groups
    const minVol = debouncedMinVolume ? parseFloat(debouncedMinVolume) : null;
    const maxVol = debouncedMaxVolume ? parseFloat(debouncedMaxVolume) : null;

    if (minVol !== null && !isNaN(minVol)) {
      filtered = filtered.filter(g =>
        g.parent.searchVolume !== undefined && g.parent.searchVolume >= minVol
      );
    }

    if (maxVol !== null && !isNaN(maxVol)) {
      filtered = filtered.filter(g =>
        g.parent.searchVolume !== undefined && g.parent.searchVolume <= maxVol
      );
    }

    // Apply sorting to groups based on parent keyword properties
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a.parent[sortConfig.key] ?? '';
        const bValue = b.parent[sortConfig.key] ?? '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [groups, typeFilter, scoreFilter, debouncedGlobalFilter, includeKeywords, excludeKeywords, debouncedMinVolume, debouncedMaxVolume, sortConfig]);

  // Flatten groups for grouped view
  const flattenedGroups = useMemo(() => {
    if (viewMode !== 'grouped') return [];

    const flattened: (KeywordResult & { isParent?: boolean; groupSize?: number })[] = [];

    for (const group of filteredGroups) {
      flattened.push({
        ...group.parent,
        isParent: true,
        groupSize: group.variations.length
      });
      // Add variations (indented in display)
      for (const variation of group.variations) {
        flattened.push(variation);
      }
    }

    return flattened;
  }, [filteredGroups, viewMode]);

  const handleSort = useCallback((key: keyof KeywordResult) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  }, []);

  const displayData = viewMode === 'grouped' ? flattenedGroups : processedData;

  // Table columns configuration
  const columns = [
    { key: 'keyword', label: 'Keyword', width: 300 },
    { key: 'searchVolume', label: 'Search Vol.', width: 120 },
    { key: 'type', label: 'Type', width: 120 },
    { key: 'score', label: 'Score', width: 180 },
    { key: 'reasoning', label: 'Analysis', width: undefined }, // flexible width
  ];

  // Row renderer for virtualized table
  const rowContent = useCallback((_index: number, item: KeywordResult & { isParent?: boolean; groupSize?: number }) => {
    const typeConfig = {
      generic: { icon: TrendingUp, color: 'bg-blue-100 text-blue-800', label: 'Generic' },
      our_brand: { icon: Package, color: 'bg-green-100 text-green-800', label: 'Our Brand' },
      competitor_brand: { icon: Zap, color: 'bg-orange-100 text-orange-800', label: 'Competitor' },
    };
    
    const config = typeConfig[item.type as keyof typeof typeConfig];
    const Icon = config.icon;
    const percentage = item.score * 10;
    const scoreColor = item.score >= 7 ? 'bg-green-500' : item.score >= 4 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <>
        <td className={`px-3 py-3 ${item.isParent ? 'font-semibold' : ''} ${!item.isParent && viewMode === 'grouped' ? 'pl-8' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="break-words whitespace-normal" title={item.keyword}>
              {item.keyword}
            </span>
            {item.isParent && item.groupSize! > 0 && (
              <span className="text-xs text-gray-500">
                (+{item.groupSize} variations)
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-3 text-right">
          {item.searchVolume != null ? item.searchVolume.toLocaleString() : '-'}
        </td>
        <td className="px-3 py-3">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className={`${scoreColor} h-2 rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium w-12">{item.score}/10</span>
          </div>
        </td>
        <td className="px-3 py-3">
          <p className="text-sm text-gray-600 line-clamp-3 break-words whitespace-normal" title={item.reasoning}>
            {item.reasoning}
          </p>
        </td>
      </>
    );
  }, [viewMode]);
  
  const handleAddIncludeKeyword = useCallback((keyword: string) => {
    setIncludeKeywords(prev => [...prev, keyword]);
  }, []);
  
  const handleRemoveIncludeKeyword = useCallback((keyword: string) => {
    setIncludeKeywords(prev => prev.filter(k => k !== keyword));
  }, []);
  
  const handleAddExcludeKeyword = useCallback((keyword: string) => {
    setExcludeKeywords(prev => [...prev, keyword]);
  }, []);
  
  const handleRemoveExcludeKeyword = useCallback((keyword: string) => {
    setExcludeKeywords(prev => prev.filter(k => k !== keyword));
  }, []);

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-2xl">
                {isNaN(summary.average_score) ? '0.0' : summary.average_score.toFixed(1)}/10
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Keywords</CardDescription>
              <CardTitle className="text-2xl">{summary.total_keywords || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Generic Keywords</CardDescription>
              <CardTitle className="text-2xl">{summary.by_type?.generic || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Brand Keywords</CardDescription>
              <CardTitle className="text-2xl">
                {(summary.by_type?.our_brand || 0) + (summary.by_type?.competitor_brand || 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            Review keyword relevance and classification results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search keywords..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grouped' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grouped')}
                  className="flex items-center gap-1"
                >
                  <Layers className="h-4 w-4" />
                  Grouped
                </Button>
                <Button
                  variant={viewMode === 'flat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('flat')}
                  className="flex items-center gap-1"
                >
                  <List className="h-4 w-4" />
                  Flat
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="generic">Generic</SelectItem>
                    <SelectItem value="our_brand">Our Brand</SelectItem>
                    <SelectItem value="competitor_brand">Competitor</SelectItem>
                  </SelectContent>
                </Select>

                <ScoreFilterMultiSelect
                  selectedScores={scoreFilter}
                  onScoreChange={setScoreFilter}
                />
              </div>

              <div className="flex gap-2">
                <ExportDropdown
                  onExport={(format, mode) => {
                    let exportData: KeywordResult[];
                    if (mode === 'grouped' && viewMode === 'grouped') {
                      // Original: Export all parent keywords (unfiltered)
                      exportData = groups.map(g => g.parent);
                    } else if (mode === 'filtered-all') {
                      // New: Export filtered keywords (all variations)
                      exportData = processedData;
                    } else if (mode === 'filtered-parents' && viewMode === 'grouped') {
                      // New: Export filtered parent keywords only
                      exportData = filteredGroups.map(g => g.parent);
                    } else if (mode === 'filtered-parents' && viewMode === 'flat') {
                      // If in flat view, treat filtered-parents same as filtered-all
                      exportData = processedData;
                    } else if (mode === 'flat') {
                      // Original: Export all keywords (unfiltered)
                      exportData = results;
                    } else {
                      // Default to processed data
                      exportData = processedData;
                    }
                    onExport(format, exportData, mode);
                  }}
                  isGroupedView={viewMode === 'grouped'}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Include Keywords
              </label>
              <KeywordTagInput
                placeholder="Type keyword and press Enter to include..."
                tags={includeKeywords}
                onAddTag={handleAddIncludeKeyword}
                onRemoveTag={handleRemoveIncludeKeyword}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Exclude Keywords
              </label>
              <KeywordTagInput
                placeholder="Type keyword and press Enter to exclude..."
                tags={excludeKeywords}
                onAddTag={handleAddExcludeKeyword}
                onRemoveTag={handleRemoveExcludeKeyword}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Min Search Volume
              </label>
              <Input
                type="number"
                placeholder="Min volume..."
                value={minVolume}
                onChange={(e) => setMinVolume(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Max Search Volume
              </label>
              <Input
                type="number"
                placeholder="Max volume..."
                value={maxVolume}
                onChange={(e) => setMaxVolume(e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <TableVirtuoso
              data={displayData}
              fixedHeaderContent={() => (
                <tr className="bg-white border-b">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 text-left font-medium bg-white"
                      style={{ width: col.width }}
                    >
                      {['keyword', 'searchVolume', 'score'].includes(col.key) ? (
                        <Button
                          variant="ghost"
                          onClick={() => handleSort(col.key as keyof KeywordResult)}
                          className="h-8 px-2 w-full justify-start"
                        >
                          {col.label}
                          <ArrowUpDown className="ml-2 h-4 w-4 flex-shrink-0" />
                        </Button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              )}
              itemContent={rowContent}
              components={{
                Table: ({ style, ...props }) => (
                  <table {...props} style={{ ...style, width: '100%', tableLayout: 'fixed' }} />
                ),
                TableRow: ({ ...props }) => (
                  <tr {...props} className="border-b hover:bg-muted/50 transition-colors" />
                ),
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {viewMode === 'grouped' 
                ? `Showing ${groups.length} keyword groups (${displayData.length} total keywords)`
                : `Showing ${displayData.length} results`
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}