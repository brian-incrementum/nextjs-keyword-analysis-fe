'use client';

import { useState } from 'react';
import { GroupedKeywordCard } from '@/components/keyword-analysis/GroupedKeywordCard';
import { GroupedKeywordTable } from '@/components/keyword-analysis/GroupedKeywordTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { groupKeywords, getGroupingStats } from '@/lib/keyword-grouping';
import type { KeywordResult } from '@/types/keyword-analysis';

// Sample data to test strict phrase matching
const sampleData: KeywordResult[] = [
  // Test possessive forms - all should group together
  {
    keyword: "men's long johns",
    type: "generic",
    score: 9,
    reasoning: "With apostrophe possessive",
    relevance: 90,
    searchVolume: 45000,
  },
  {
    keyword: "men's long john",
    type: "generic",
    score: 9,
    reasoning: "Singular with apostrophe",
    relevance: 90,
    searchVolume: 12000,
  },
  {
    keyword: "men long johns",
    type: "generic",
    score: 8,
    reasoning: "Without apostrophe plural",
    relevance: 80,
    searchVolume: 8000,
  },
  {
    keyword: "mens long john",
    type: "generic",
    score: 8,
    reasoning: "Common typo without apostrophe",
    relevance: 80,
    searchVolume: 15000,
  },
  
  // Group 1: dog treats (these SHOULD group)
  {
    keyword: "dog treats",
    type: "generic",
    score: 9,
    reasoning: "High relevance product keyword for pet supplies",
    relevance: 90,
    searchVolume: 50000,
  },
  {
    keyword: "dog treat",
    type: "generic",
    score: 9,
    reasoning: "Singular form of main keyword, commonly used in searches",
    relevance: 90,
    searchVolume: 20000,
  },
  {
    keyword: "the dog treats",
    type: "generic",
    score: 8,
    reasoning: "Same phrase with stop word",
    relevance: 80,
    searchVolume: 5000,
  },
  
  // These should NOT group with "dog treats"
  {
    keyword: "organic dog treats",
    type: "generic",
    score: 8,
    reasoning: "Has additional modifier 'organic' - different product",
    relevance: 80,
    searchVolume: 12000,
  },
  {
    keyword: "treats for dogs",
    type: "generic",
    score: 7,
    reasoning: "Different word order - not the same phrase",
    relevance: 70,
    searchVolume: 3000,
  },
  {
    keyword: "natural dog treats",
    type: "generic",
    score: 8,
    reasoning: "Has additional modifier 'natural' - different product",
    relevance: 80,
    searchVolume: 9500,
  },
  
  // Group 2: teeth/tooth whitening (these SHOULD group)
  {
    keyword: "teeth whitening",
    type: "generic",
    score: 8,
    reasoning: "Related dental care product with high search intent",
    relevance: 80,
    searchVolume: 18000,
  },
  {
    keyword: "tooth whitening",
    type: "generic",
    score: 9,
    reasoning: "Alternative form of teeth whitening, primary dental keyword",
    relevance: 90,
    searchVolume: 22000,
  },
  
  // These should NOT group with "teeth whitening"
  {
    keyword: "teeth whitener",
    type: "generic",
    score: 8,
    reasoning: "Different word form - 'whitener' vs 'whitening'",
    relevance: 80,
    searchVolume: 5000,
  },
  {
    keyword: "whitening teeth",
    type: "generic",
    score: 7,
    reasoning: "Different word order - not the same phrase",
    relevance: 70,
    searchVolume: 2000,
  },
  
  // Group 3: mouse/mice repellent (these SHOULD group)
  {
    keyword: "mouse repellent",
    type: "generic",
    score: 7,
    reasoning: "Pest control product with moderate relevance",
    relevance: 70,
    searchVolume: 12000,
  },
  {
    keyword: "mice repellent",
    type: "generic",
    score: 7,
    reasoning: "Plural form variation for pest control searches",
    relevance: 70,
    searchVolume: 8000,
  },
  
  // Standalone (should not group)
  {
    keyword: "repellent for mice",
    type: "generic",
    score: 6,
    reasoning: "Different word order - not the same phrase",
    relevance: 60,
    searchVolume: 1500,
  },
];

export default function TestGroupingPage() {
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'flat'>('table');
  const groupedKeywords = groupKeywords(sampleData);
  const stats = getGroupingStats(groupedKeywords);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Keyword Grouping Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Grouping Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.totalKeywords}</div>
              <div className="text-sm text-gray-500">Total Keywords</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalGroups}</div>
              <div className="text-sm text-gray-500">Keyword Groups</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.groupsWithVariations}</div>
              <div className="text-sm text-gray-500">Groups with Variations</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.averageVariationsPerGroup}</div>
              <div className="text-sm text-gray-500">Avg Variations/Group</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mb-4 flex gap-2">
        <Button 
          onClick={() => setViewMode('table')}
          variant={viewMode === 'table' ? "default" : "outline"}
        >
          Table View
        </Button>
        <Button 
          onClick={() => setViewMode('cards')}
          variant={viewMode === 'cards' ? "default" : "outline"}
        >
          Card View
        </Button>
        <Button 
          onClick={() => setViewMode('flat')}
          variant={viewMode === 'flat' ? "default" : "outline"}
        >
          Flat View
        </Button>
      </div>
      
      {viewMode === 'table' ? (
        <div>
          <h2 className="text-xl font-semibold mb-3">Grouped Keywords (Table)</h2>
          <Card>
            <CardContent className="p-0">
              <GroupedKeywordTable groups={groupedKeywords} />
            </CardContent>
          </Card>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-3">Grouped Keywords (Cards)</h2>
          {groupedKeywords.map((group, index) => (
            <GroupedKeywordCard key={index} group={group} defaultExpanded={index === 0} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold mb-3">All Keywords (Flat View)</h2>
          <Card>
            <CardContent className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Keyword</th>
                    <th className="text-left pb-2">Type</th>
                    <th className="text-right pb-2">Volume</th>
                    <th className="text-right pb-2">Score</th>
                    <th className="text-left pb-2">Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((keyword, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2">{keyword.keyword}</td>
                      <td className="py-2">{keyword.type}</td>
                      <td className="py-2 text-right">{keyword.searchVolume?.toLocaleString()}</td>
                      <td className="py-2 text-right">{keyword.score}/10</td>
                      <td className="py-2">{keyword.reasoning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}