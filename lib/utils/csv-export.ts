import Papa from 'papaparse';
import type { KeywordResult, RootAnalysisResult } from '@/types/keyword-analysis';

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
