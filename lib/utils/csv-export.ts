import Papa from 'papaparse';
import type { KeywordResult } from '@/types/keyword-analysis';

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