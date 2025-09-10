'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, Package, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GroupedKeywordResult, KeywordResult } from '@/types/keyword-analysis';

interface GroupedKeywordTableProps {
  groups: GroupedKeywordResult[];
}

interface ExpandedState {
  [key: string]: boolean;
}

export function GroupedKeywordTable({ groups }: GroupedKeywordTableProps) {
  const [expandedRows, setExpandedRows] = useState<ExpandedState>({});
  
  const toggleExpanded = (keyword: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [keyword]: !prev[keyword]
    }));
  };
  
  const getTypeConfig = (type: string) => {
    const configs = {
      generic: { icon: TrendingUp, color: 'bg-blue-100 text-blue-800', label: 'Generic' },
      our_brand: { icon: Package, color: 'bg-green-100 text-green-800', label: 'Our Brand' },
      competitor_brand: { icon: Zap, color: 'bg-orange-100 text-orange-800', label: 'Competitor' },
    };
    return configs[type as keyof typeof configs] || configs.generic;
  };
  
  const formatSearchVolume = (volume?: number) => {
    if (volume == null) return '-';
    return volume.toLocaleString();
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 7) return 'bg-green-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const renderKeywordRow = (keyword: KeywordResult, isVariation: boolean = false, hasVariations: boolean = false, isExpanded: boolean = false, variationCount: number = 0) => {
    const config = getTypeConfig(keyword.type);
    const Icon = config.icon;
    const percentage = keyword.score * 10;
    
    return (
      <>
        <td className="px-3 py-3 align-top w-[300px]">
          <div className={cn("flex items-center gap-2", isVariation && "pl-8")}>
            {!isVariation && hasVariations && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(keyword.keyword);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            <div className="font-medium break-words whitespace-normal pr-4">
              {keyword.keyword}
              {!isVariation && hasVariations && (
                <span className="ml-2 text-xs text-gray-500">
                  (+{variationCount} variation{variationCount > 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="px-3 py-3 align-top w-[140px]">
          <span className="font-medium block text-right pr-2">
            {formatSearchVolume(keyword.searchVolume)}
          </span>
        </td>
        <td className="px-3 py-3 align-top w-[120px]">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </div>
        </td>
        <td className="px-3 py-3 align-top w-[180px]">
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className={`${getScoreColor(keyword.score)} h-2 rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium w-12">{keyword.score}/10</span>
          </div>
        </td>
        <td className="px-3 py-3 align-top">
          <p className="text-sm text-gray-600 line-clamp-3 break-words whitespace-normal" title={keyword.reasoning}>
            {keyword.reasoning}
          </p>
        </td>
      </>
    );
  };
  
  return (
    <table className="w-full table-fixed text-sm">
      <thead className="sticky top-0 bg-white z-20 shadow-sm">
        <tr className="border-b">
          <th className="w-[300px] px-3 py-2 text-left align-middle font-medium bg-white">
            <div className="h-8 flex items-center">Keyword</div>
          </th>
          <th className="w-[140px] px-3 py-2 text-left align-middle font-medium bg-white">
            <div className="h-8 flex items-center">Search Vol.</div>
          </th>
          <th className="w-[120px] px-3 py-2 text-left align-middle font-medium bg-white">
            <div className="h-8 flex items-center">Type</div>
          </th>
          <th className="w-[180px] px-3 py-2 text-left align-middle font-medium bg-white">
            <div className="h-8 flex items-center">Score</div>
          </th>
          <th className="px-3 py-2 text-left align-middle font-medium bg-white">
            <div className="h-8 flex items-center">Analysis</div>
          </th>
        </tr>
      </thead>
      <tbody className="[&_tr:last-child]:border-0">
        {groups.map((group, groupIndex) => {
          const isExpanded = expandedRows[group.parent.keyword];
          const hasVariations = group.variations.length > 0;
          
          return (
            <React.Fragment key={groupIndex}>
              {/* Parent Row */}
              <tr 
                className={cn(
                  "border-b hover:bg-muted/50 transition-colors",
                  hasVariations && "cursor-pointer"
                )} 
                onClick={hasVariations ? () => toggleExpanded(group.parent.keyword) : undefined}
              >
                {renderKeywordRow(group.parent, false, hasVariations, isExpanded, group.variations.length)}
              </tr>
              
              {/* Variation Rows */}
              {hasVariations && isExpanded && group.variations.map((variation, varIndex) => (
                <tr 
                  key={`${groupIndex}-${varIndex}`}
                  className={cn(
                    "border-b bg-gray-50/50 hover:bg-gray-100/50 transition-colors",
                    varIndex === group.variations.length - 1 && "border-b-gray-200"
                  )}
                >
                  {renderKeywordRow(variation, true)}
                </tr>
              ))}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}