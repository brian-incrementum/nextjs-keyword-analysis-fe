import Papa from 'papaparse';
import type { KeywordResult, RootAnalysisResult, Segment, GroupedKeywordResult } from '@/types/keyword-analysis';

export function exportToCSV(data: KeywordResult[], filename: string = 'keyword-analysis-results.csv'): void {
  const csv = Papa.unparse(data, {
    header: true,
    columns: ['keyword', 'searchVolume', 'type', 'score', 'reasoning'],
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(data: KeywordResult[], filename: string = 'keyword-analysis-results'): void {
  const headers = ['Keyword', 'Search Volume', 'Type', 'Score', 'Analysis'];
  
  const csvContent = [
    headers.join('\t'),
    ...data.map(row => [
      row.keyword,
      row.searchVolume || '',
      row.type,
      row.score,
      row.reasoning || ''
    ].join('\t'))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRootMembersToCSV(root: RootAnalysisResult, filename?: string): void {
  const rows = root.members.map(member => ({
    root: root.normalized_term,
    keyword: member.keyword,
    search_volume: member.search_volume ?? '',
    frequency: root.frequency,
    root_search_volume: root.search_volume ?? '',
    relative_volume: root.relative_volume !== undefined ? root.relative_volume : '',
  }));

  const csv = Papa.unparse(rows, {
    header: true,
    columns: ['root', 'keyword', 'search_volume', 'frequency', 'root_search_volume', 'relative_volume'],
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename ?? `${root.normalized_term}-keywords.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportNegativePhrasesToCSV(phrases: string[], filename: string = 'negative-phrases.csv'): void {
  const rows = phrases.map(phrase => ({ 'Negative Phrases': phrase }));

  const csv = Papa.unparse(rows, {
    header: true,
    columns: ['Negative Phrases'],
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSegmentsToCSV(
  groups: GroupedKeywordResult[],
  segments: Segment[],
  filename: string = 'keyword-segments.csv'
): void {
  // Create a map of keyword to segment name
  const keywordToSegment = new Map<string, string>();
  segments.forEach((segment) => {
    segment.keywords.forEach((keyword) => {
      keywordToSegment.set(keyword, segment.name);
    });
  });

  // Create rows with only segmented keywords (filter out unassigned ones)
  const rows = groups
    .filter((group) => keywordToSegment.has(group.parent.keyword))
    .map((group) => ({
      keyword: group.parent.keyword,
      searchVolume: group.parent.searchVolume || '',
      type: group.parent.type,
      score: group.parent.score,
      reasoning: group.parent.reasoning,
      segment: keywordToSegment.get(group.parent.keyword) || '',
    }));

  const csv = Papa.unparse(rows, {
    header: true,
    columns: ['keyword', 'searchVolume', 'type', 'score', 'reasoning', 'segment'],
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSingleSegmentToCSV(
  groups: GroupedKeywordResult[],
  segment: Segment,
  filename?: string
): void {
  // Create a set of keywords in this segment for faster lookup
  const segmentKeywords = new Set(segment.keywords);

  // Filter groups to only include keywords in this segment
  const rows = groups
    .filter((group) => segmentKeywords.has(group.parent.keyword))
    .map((group) => ({
      keyword: group.parent.keyword,
      searchVolume: group.parent.searchVolume || '',
      type: group.parent.type,
      score: group.parent.score,
      reasoning: group.parent.reasoning,
    }));

  const csv = Papa.unparse(rows, {
    header: true,
    columns: ['keyword', 'searchVolume', 'type', 'score', 'reasoning'],
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Generate filename from segment name if not provided
  const sanitizedName = segment.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'segment-keywords';
  const defaultFilename = `${sanitizedName}-${new Date().toISOString().split('T')[0]}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename || defaultFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
