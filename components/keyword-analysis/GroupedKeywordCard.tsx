'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Tag, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GroupedKeywordResult } from '@/types/keyword-analysis';

interface GroupedKeywordCardProps {
  group: GroupedKeywordResult;
  defaultExpanded?: boolean;
}

export function GroupedKeywordCard({ group, defaultExpanded = false }: GroupedKeywordCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasVariations = group.variations.length > 0;
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'generic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'our_brand':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'competitor_brand':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const formatSearchVolume = (volume?: number) => {
    if (!volume) return 'N/A';
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Parent Keyword */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {hasVariations && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-6 w-6"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              <h3 className="font-semibold text-lg">{group.parent.keyword}</h3>
              <Badge className={cn('ml-2', getTypeColor(group.parent.type))}>
                {group.parent.type.replace('_', ' ')}
              </Badge>
              {hasVariations && (
                <Badge variant="secondary" className="ml-1">
                  +{group.variations.length} variation{group.variations.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
              {group.parent.searchVolume && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Volume: {formatSearchVolume(group.parent.searchVolume)}</span>
                </div>
              )}
              <div className={cn('flex items-center gap-1', getScoreColor(group.parent.score))}>
                <Tag className="h-3 w-3" />
                <span>Score: {group.parent.score}/10</span>
              </div>
            </div>
            
            {group.parent.reasoning && (
              <p className="text-sm text-gray-500 mt-2 ml-8">{group.parent.reasoning}</p>
            )}
          </div>
          
          <div className="text-right">
            <div className={cn('text-2xl font-bold', getScoreColor(group.parent.score))}>
              {group.parent.score}/10
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        </div>
        
        {/* Variations (Expandable) */}
        {hasVariations && isExpanded && (
          <div className="mt-4 ml-8 space-y-2 border-l-2 border-gray-200 pl-4">
            {group.variations.map((variation, index) => (
              <div key={index} className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{variation.keyword}</span>
                      <Badge className={cn('text-xs', getTypeColor(variation.type))} variant="outline">
                        {variation.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                      {variation.searchVolume && (
                        <span>Volume: {formatSearchVolume(variation.searchVolume)}</span>
                      )}
                      <span className={getScoreColor(variation.score)}>
                        Score: {variation.score}/10
                      </span>
                    </div>
                    
                    {variation.reasoning && (
                      <p className="text-xs text-gray-500 mt-1">{variation.reasoning}</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className={cn('text-lg font-semibold', getScoreColor(variation.score))}>
                      {variation.score}/10
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}