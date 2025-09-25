import { lemmatizePhrase, areKeywordVariations } from './keyword-utils';
import type { KeywordResult, GroupedKeywordResult } from '@/types/keyword-analysis';

/**
 * Group keywords by their lemmatized form, keeping the highest volume keyword as parent
 */
export function groupKeywords(keywords: KeywordResult[]): GroupedKeywordResult[] {
  const groups = new Map<string, GroupedKeywordResult>();
  const processed = new Set<string>();
  
  // Sort by search volume (descending) to process highest volume first
  const sortedKeywords = [...keywords].sort((a, b) => {
    const volumeA = a.searchVolume || 0;
    const volumeB = b.searchVolume || 0;
    return volumeB - volumeA;
  });
  
  for (const keyword of sortedKeywords) {
    // Skip if already processed
    if (processed.has(keyword.keyword)) continue;
    
    const lemma = lemmatizePhrase(keyword.keyword);
    
    // Check if this keyword belongs to an existing group
    let foundGroup = false;
    for (const [_groupLemma, group] of groups.entries()) {
      if (areKeywordVariations(keyword.keyword, group.parent.keyword)) {
        // Add as a variation to existing group
        group.variations.push(keyword);
        processed.add(keyword.keyword);
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      // Create new group with this keyword as parent
      const newGroup: GroupedKeywordResult = {
        parent: keyword,
        variations: [],
        lemma: lemma,
        totalVariations: 0
      };
      
      // Find all variations of this keyword
      for (const otherKeyword of sortedKeywords) {
        if (otherKeyword.keyword !== keyword.keyword && 
            !processed.has(otherKeyword.keyword) &&
            areKeywordVariations(keyword.keyword, otherKeyword.keyword)) {
          newGroup.variations.push(otherKeyword);
          processed.add(otherKeyword.keyword);
        }
      }
      
      newGroup.totalVariations = newGroup.variations.length;
      groups.set(lemma, newGroup);
      processed.add(keyword.keyword);
    }
  }
  
  // Convert map to array and sort by parent search volume
  return Array.from(groups.values()).sort((a, b) => {
    const volumeA = a.parent.searchVolume || 0;
    const volumeB = b.parent.searchVolume || 0;
    return volumeB - volumeA;
  });
}

/**
 * Flatten grouped keywords back to a flat list
 */
export function flattenGroupedKeywords(groups: GroupedKeywordResult[]): KeywordResult[] {
  const flattened: KeywordResult[] = [];
  
  for (const group of groups) {
    flattened.push(group.parent);
    flattened.push(...group.variations);
  }
  
  return flattened;
}

/**
 * Get statistics for grouped keywords
 */
export function getGroupingStats(groups: GroupedKeywordResult[]) {
  const totalKeywords = groups.reduce((sum, group) => 
    sum + 1 + group.variations.length, 0
  );
  
  const groupsWithVariations = groups.filter(g => g.variations.length > 0).length;
  
  const averageVariationsPerGroup = groups.length > 0 
    ? groups.reduce((sum, g) => sum + g.variations.length, 0) / groups.length
    : 0;
  
  return {
    totalGroups: groups.length,
    totalKeywords,
    groupsWithVariations,
    averageVariationsPerGroup: Math.round(averageVariationsPerGroup * 10) / 10
  };
}