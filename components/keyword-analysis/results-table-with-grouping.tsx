'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
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
  // Download,
  ArrowUpDown,
  Search,
  // FileDown,
  TrendingUp,
  Package,
  Zap,
  // Filter,
  Layers,
  List
} from 'lucide-react';
import { GroupedKeywordTable } from '@/components/keyword-analysis/GroupedKeywordTable';
import { ExportDropdown } from '@/components/keyword-analysis/export-dropdown';
import { groupKeywords } from '@/lib/keyword-grouping';
import type { KeywordResult } from '@/types/keyword-analysis';

interface ResultsTableProps {
  results: KeywordResult[];
  onExport: (format: 'csv' | 'xlsx', exportData?: KeywordResult[]) => void;
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

export function ResultsTableWithGrouping({ results, onExport, summary }: ResultsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const columns = useMemo<ColumnDef<KeywordResult>[]>(
    () => [
      {
        accessorKey: 'keyword',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 w-full justify-start"
            >
              Keyword
              <ArrowUpDown className="ml-2 h-4 w-4 flex-shrink-0" />
            </Button>
          );
        },
        cell: ({ getValue }) => {
          return (
            <div className="font-medium break-words whitespace-normal pr-4" title={getValue() as string}>
              {getValue() as string}
            </div>
          );
        },
      },
      {
        accessorKey: 'searchVolume',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 w-full justify-start"
            >
              <span className="truncate">Search Vol.</span>
              <ArrowUpDown className="ml-2 h-4 w-4 flex-shrink-0" />
            </Button>
          );
        },
        cell: ({ getValue }) => {
          const value = getValue() as number | undefined;
          return (
            <span className="font-medium block text-right pr-2">
              {value != null ? value.toLocaleString() : '-'}
            </span>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const typeConfig = {
            generic: { icon: TrendingUp, color: 'bg-blue-100 text-blue-800', label: 'Generic' },
            our_brand: { icon: Package, color: 'bg-green-100 text-green-800', label: 'Our Brand' },
            competitor_brand: { icon: Zap, color: 'bg-orange-100 text-orange-800', label: 'Competitor' },
          };
          
          const config = typeConfig[value as keyof typeof typeConfig];
          const Icon = config.icon;
          
          return (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </div>
          );
        },
      },
      {
        accessorKey: 'score',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 w-full justify-start"
            >
              Score
              <ArrowUpDown className="ml-2 h-4 w-4 flex-shrink-0" />
            </Button>
          );
        },
        cell: ({ getValue }) => {
          const value = getValue() as number;
          const percentage = value * 10;
          const color = value >= 7 ? 'bg-green-500' : value >= 4 ? 'bg-yellow-500' : 'bg-red-500';
          
          return (
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className={`${color} h-2 rounded-full transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium w-12">{value}/10</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'reasoning',
        header: 'Analysis',
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <div className="w-full">
              <p className="text-sm text-gray-600 line-clamp-3 break-words whitespace-normal" title={value}>
                {value}
              </p>
            </div>
          );
        },
      },
    ],
    []
  );

  // Apply custom filters
  const filteredResults = useMemo(() => {
    let filtered = results;
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Apply score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (scoreFilter === 'high') return item.score >= 8;
        if (scoreFilter === 'medium') return item.score >= 5 && item.score <= 7;
        if (scoreFilter === 'low') return item.score <= 4;
        return true;
      });
    }
    
    // Apply global filter
    if (globalFilter) {
      filtered = filtered.filter(item => 
        item.keyword.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.reasoning?.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [results, typeFilter, scoreFilter, globalFilter]);

  // Group keywords if in grouped view
  const groupedKeywords = useMemo(() => {
    if (viewMode === 'grouped') {
      return groupKeywords(filteredResults);
    }
    return [];
  }, [filteredResults, viewMode]);

  const table = useReactTable({
    data: filteredResults,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  // Total rows after filtering/sorting
  const totalRowCount = table.getRowModel().rows.length;

  // Reset visible count when the dataset or filters/sorting change
  useEffect(() => {
    const initial = Math.min(100, totalRowCount || 0);
    setVisibleCount(initial);
  }, [totalRowCount, results, globalFilter, sorting, columnFilters]);

  // Infinite scroll using IntersectionObserver with the scroll container as root
  useEffect(() => {
    if (!containerRef.current || !sentinelRef.current || viewMode === 'grouped') return;

    const root = containerRef.current;
    const sentinel = sentinelRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + 100, totalRowCount));
          }
        }
      },
      { root, rootMargin: '200px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [totalRowCount, viewMode]);

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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search keywords..."
                value={globalFilter ?? ''}
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
              
              <div className="w-px h-6 bg-gray-300 mx-1" />
              
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
              
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="high">High (8-10)</SelectItem>
                  <SelectItem value="medium">Medium (5-7)</SelectItem>
                  <SelectItem value="low">Low (1-4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <ExportDropdown 
                onExport={(format, mode) => {
                  // Prepare export data based on mode
                  let exportData: KeywordResult[];
                  if (mode === 'grouped') {
                    // Export only parent keywords from groups
                    exportData = groupedKeywords.map(g => g.parent);
                  } else {
                    // Export all keywords (flat)
                    exportData = filteredResults;
                  }
                  onExport(format, exportData);
                }}
                isGroupedView={viewMode === 'grouped'}
              />
            </div>
          </div>

          <div ref={containerRef} className="border rounded-lg overflow-auto max-h-[70vh] relative">
            {viewMode === 'grouped' ? (
              <GroupedKeywordTable groups={groupedKeywords} sortConfig={null} onSort={() => {}} />
            ) : (
              <>
                <table className="w-full table-fixed text-sm">
                  <thead className="sticky top-0 bg-white z-20 shadow-sm">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b">
                        {headerGroup.headers.map((header, index) => {
                          const widthClasses = [
                            'w-[300px]', // Keyword - fixed width
                            'w-[140px]', // Search Volume - fixed width (increased for header space)
                            'w-[120px]', // Type - fixed width
                            'w-[180px]', // Score - fixed width
                            '', // Analysis - takes remaining space
                          ];
                          return (
                            <th key={header.id} className={`${widthClasses[index] || ''} px-3 py-2 text-left align-middle font-medium bg-white`}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.slice(0, visibleCount).map((row) => (
                        <tr key={row.id} className="border-b hover:bg-muted/50 transition-colors">
                          {row.getVisibleCells().map((cell, index) => {
                            const widthClasses = [
                              'w-[300px]', // Keyword - fixed width
                              'w-[140px]', // Search Volume - fixed width (matches header)
                              'w-[120px]', // Type - fixed width
                              'w-[180px]', // Score - fixed width
                              '', // Analysis - takes remaining space
                            ];
                            return (
                              <td key={cell.id} className={`${widthClasses[index] || ''} px-3 py-3 align-top`}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="h-24 text-center">
                          No results found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* Sentinel for infinite scroll */}
                <div ref={sentinelRef} className="h-8" />
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {viewMode === 'grouped' 
                ? `Showing ${groupedKeywords.length} keyword groups (${totalRowCount} total keywords)`
                : `Showing ${Math.min(visibleCount, totalRowCount)} of ${totalRowCount} results`
              }
            </div>
            {viewMode === 'flat' && visibleCount < totalRowCount && (
              <div className="text-sm text-gray-500">Scroll to load more…</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}