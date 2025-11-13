'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import type { CSVData } from '@/types/keyword-analysis';

interface CSVUploadProps {
  onUpload: (keywords: string[], csvData: CSVData) => void;
  isDisabled?: boolean;
}

export function CSVUploadComponent({ onUpload, isDisabled = false }: CSVUploadProps) {
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedVolumeColumn, setSelectedVolumeColumn] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectKeywordColumn = (headers: string[]): string | undefined => {
    const keywordPatterns = [
      'keyword', 'keywords', 'search term', 'search terms', 
      'query', 'queries', 'term', 'terms'
    ];
    
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    for (const pattern of keywordPatterns) {
      const index = normalizedHeaders.findIndex(h => h.includes(pattern));
      if (index !== -1) {
        return headers[index];
      }
    }
    
    return headers[0];
  };

  const detectSearchVolumeColumn = (headers: string[], rows: Record<string, string>[]): string | undefined => {
    // Build a score for each header based on name patterns and data characteristics
    const headerScores: Record<string, number> = {};

    const normalize = (s: string) => s.toLowerCase().trim();
    const tokens = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);

    const strongNamePatterns: RegExp[] = [
      /monthly\s*search\s*volume\s*exact/, // "Monthly Search Volume Exact"
      /monthly\s*search\s*volume/,
      /\bmsv\b/,
      /avg(eral|\.)?\s*monthly\s*search(es)?/,
    ];
    const mediumNamePatterns: RegExp[] = [
      /search\s*volume/,
      /search_volume/,
      /search\s*vol/,
      /search(es)?\b/,
      /search\s*count/,
    ];

    const isSVToken = (tkns: string[]) => tkns.includes('sv') || tkns.includes('msv');

    // Name-based scoring
    for (const header of headers) {
      const hNorm = normalize(header);
      const tkns = tokens(header);
      let score = 0;

      if (strongNamePatterns.some((rx) => rx.test(hNorm))) score += 5;
      if (mediumNamePatterns.some((rx) => rx.test(hNorm))) score += 3;
      if (isSVToken(tkns)) score += 2; // favor abbreviations if present as tokens
      if (tkns.includes('volume')) score += 1;
      if (tkns.includes('monthly')) score += 1;
      if (tkns.includes('exact')) score += 1;

      headerScores[header] = score;
    }

    // Data-based scoring: prefer columns that look numeric and within plausible ranges
    const sample = rows.slice(0, 100);
    const parseNum = (v: unknown): number | null => {
      if (v == null) return null;
      const str = String(v).trim();
      if (!str) return null;
      // Skip obvious non-numeric like dates or textual
      const cleaned = str.replace(/[,\s]/g, '');
      const num = Number(cleaned);
      if (Number.isNaN(num)) return null;
      return num;
    };

    for (const header of headers) {
      let numericCount = 0;
      let totalCount = 0;
      let gt1k = 0;
      for (const row of sample) {
        if (row && Object.prototype.hasOwnProperty.call(row, header)) {
          const num = parseNum(row[header]);
          totalCount++;
          if (num != null) {
            numericCount++;
            if (num >= 1000) gt1k++;
          }
        }
      }
      if (totalCount > 0) {
        const ratio = numericCount / totalCount;
        if (ratio >= 0.7) headerScores[header] += 2;
        else if (ratio >= 0.4) headerScores[header] += 1;
        if (gt1k > 0) headerScores[header] += 1; // volumes commonly large
      }
    }

    // Choose the header with the highest score > 0
    const candidates = Object.entries(headerScores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    return candidates.length ? candidates[0][0] : undefined;
  };

  const processCSV = useCallback((file: File) => {
    console.log('Processing CSV file:', file.name, 'Size:', file.size);
    setError('');
    setFile(file);
    setIsProcessing(true);

    // Read file as text first
    const reader = new FileReader();
    
    reader.onload = (e) => {
      let text = e.target?.result as string;

      // Remove UTF-8 BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1);
      }

      // Parse with Papa Parse (without worker for now to avoid issues)
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          console.log('Parse complete, rows:', result.data.length);
          setIsProcessing(false);
          
          if (result.errors.length > 0) {
            console.error('CSV parsing errors:', result.errors);
            // Don't fail completely on minor errors
            if (result.data.length === 0) {
              setError('Error parsing CSV file. Please check the format.');
              return;
            }
          }

          const parsedData = result.data as Record<string, string>[];
          
          if (parsedData.length === 0) {
            setError('CSV file appears to be empty.');
            return;
          }

          const headers = result.meta.fields || Object.keys(parsedData[0]);
          
          // Limit preview to first 1000 rows for performance
          const previewRows = parsedData.slice(0, 1000);
          
          const csvDataObj: CSVData = {
            headers,
            rows: previewRows,
            allRows: parsedData,
          };

          const detectedColumn = detectKeywordColumn(headers);
          if (detectedColumn) {
            csvDataObj.detectedKeywordColumn = detectedColumn;
            csvDataObj.selectedKeywordColumn = detectedColumn;
            setSelectedColumn(detectedColumn);
          }

          const detectedVolume = detectSearchVolumeColumn(headers, previewRows);
          if (detectedVolume) {
            csvDataObj.detectedSearchVolumeColumn = detectedVolume;
            csvDataObj.selectedSearchVolumeColumn = detectedVolume;
            setSelectedVolumeColumn(detectedVolume);
          }

          setCSVData(csvDataObj);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error: any) => {
          console.error('Parse error:', error);
          setIsProcessing(false);
          setError(`Error reading file: ${error.message}`);
        },
      });
    };

    reader.onerror = () => {
      console.error('FileReader error');
      setIsProcessing(false);
      setError('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  }, []);

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) {
      return;
    }

    const file = fileArray[0];
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }

    // Check file size (warn if > 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.warn(`Large file detected: ${sizeMB}MB. Processing may take a moment.`);
    }

    processCSV(file);
  }, [processCSV]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles.length);
    handleFileSelect(acceptedFiles);
  }, [handleFileSelect]);

  const { getRootProps, getInputProps: _getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isDisabled || isProcessing,
    noClick: true, // Disable click on the dropzone
    noKeyboard: true, // Disable keyboard
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files?.length);
    const files = e.target.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const handleColumnSelect = (column: string) => {
    setSelectedColumn(column);
    setCSVData(prev => prev ? { ...prev, selectedKeywordColumn: column } : prev);
  };

  const handleVolumeColumnSelect = (column: string) => {
    setSelectedVolumeColumn(column === '__none' ? '' : column);
    setCSVData(prev => prev ? { ...prev, selectedSearchVolumeColumn: column === '__none' ? undefined : column } : prev);
  };

  const handleConfirm = () => {
    if (!csvData || !selectedColumn) {
      setError('Please select a column containing keywords.');
      return;
    }

    const finalizeUpload = (allRows: Record<string, string>[]) => {
      // Find the actual header to use (handle empty headers with fallback names)
      const actualColumnKey = csvData.headers.find((h, idx) => {
        const headerValue = h.trim() || `Column ${idx + 1}`;
        return headerValue === selectedColumn;
      }) || selectedColumn;

      const keywords = allRows
        .map(row => (row[actualColumnKey] ?? '').toString().trim())
        .filter(keyword => keyword !== '');

      if (keywords.length === 0) {
        setError('Selected column contains no valid keywords.');
        setIsProcessing(false);
        return;
      }

      console.log(`Extracted ${keywords.length} keywords from column "${selectedColumn}"`);

      // Build optional metadata mapping (e.g., search volume)
      let keywordMeta: Record<string, { searchVolume?: number }> | undefined;
      if (selectedVolumeColumn && selectedVolumeColumn !== '__none') {
        keywordMeta = {};

        const actualVolumeKey = csvData.headers.find((h, idx) => {
          const headerValue = h.trim() || `Column ${idx + 1}`;
          return headerValue === selectedVolumeColumn;
        }) || selectedVolumeColumn;

        for (const row of allRows) {
          const kw = (row[actualColumnKey] ?? '').toString().trim();
          if (!kw) continue;
          const raw = row[actualVolumeKey];
          if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
            const num = Number(String(raw).replace(/[\s,]/g, ''));
            if (!Number.isNaN(num)) {
              const key = kw.toLowerCase();
              if (!keywordMeta[key]) keywordMeta[key] = {};
              if (keywordMeta[key].searchVolume === undefined) {
                keywordMeta[key].searchVolume = num;
              }
            }
          }
        }
      }

      onUpload(keywords, {
        headers: csvData.headers,
        rows: csvData.rows,
        allRows,
        detectedKeywordColumn: csvData.detectedKeywordColumn,
        detectedSearchVolumeColumn: csvData.detectedSearchVolumeColumn,
        selectedKeywordColumn: selectedColumn,
        selectedSearchVolumeColumn: selectedVolumeColumn || undefined,
        keywordMeta,
      });

      setIsProcessing(false);
    };

    setIsProcessing(true);

    if (csvData.allRows && csvData.allRows.length > 0) {
      finalizeUpload(csvData.allRows);
      return;
    }

    if (!file) {
      setIsProcessing(false);
      setError('Unable to read CSV file. Please re-upload.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      let text = e.target?.result as string;

      // Remove UTF-8 BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1);
      }

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const allRows = result.data as Record<string, string>[];

          finalizeUpload(allRows);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error: any) => {
          setIsProcessing(false);
          setError(`Error processing keywords: ${error.message}`);
        },
      });
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setError('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  };

  const handleClear = () => {
    setCSVData(null);
    setSelectedColumn('');
    setError('');
    setFile(null);
    setIsProcessing(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Keywords CSV</CardTitle>
        <CardDescription>
          Upload a CSV file containing your keywords. We&apos;ll auto-detect the keyword column.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProcessing && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Processing CSV file...</AlertDescription>
          </Alert>
        )}

        {!csvData && !isProcessing ? (
          <>
            {/* Dropzone area */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
                ${isDisabled || isProcessing ? 'opacity-50' : ''}
              `}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop the CSV file here' : 'Drag & drop your CSV file here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <input
                id="csv-file-input"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="sr-only"
                disabled={isDisabled || isProcessing}
              />
              <button
                type="button"
                className={`
                  inline-flex items-center justify-center rounded-md text-sm font-medium 
                  ring-offset-background transition-colors focus-visible:outline-none 
                  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
                  border border-input bg-background hover:bg-accent hover:text-accent-foreground
                  h-9 px-3 cursor-pointer
                  ${isDisabled || isProcessing ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                `}
                onClick={(e) => {
                  // Prevent the dropzone root from intercepting the click,
                  // then explicitly trigger the hidden file input.
                  e.preventDefault();
                  e.stopPropagation();
                  // Reset the input value so selecting the same file triggers onChange
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  fileInputRef.current?.click();
                }}
              >
                Select File
              </button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : csvData ? (
          <>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  <FileText className="inline w-4 h-4 mr-2" />
                  {file?.name} uploaded successfully
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={isDisabled || isProcessing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="column-select">Select Keyword Column</Label>
              <Select
                value={selectedColumn}
                onValueChange={handleColumnSelect}
                disabled={isDisabled || isProcessing}
              >
                <SelectTrigger id="column-select">
                  <SelectValue placeholder="Choose the column containing keywords" />
                </SelectTrigger>
                <SelectContent>
                  {csvData.headers.map((header, index) => {
                    // Skip empty headers or provide a fallback value
                    const headerValue = header.trim() || `Column ${index + 1}`;
                    const displayName = header.trim() || `(Empty Column ${index + 1})`;
                    return (
                      <SelectItem key={`col-${index}`} value={headerValue}>
                        {displayName}
                        {csvData.detectedKeywordColumn === header && ' (Auto-detected)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume-column-select">Select Search Volume Column (optional)</Label>
              <Select
                value={selectedVolumeColumn}
                onValueChange={handleVolumeColumnSelect}
                disabled={isDisabled || isProcessing}
              >
                <SelectTrigger id="volume-column-select">
                  <SelectValue placeholder="Choose search volume column (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="__none" value="__none">
                    None
                  </SelectItem>
                  {csvData.headers.map((header, index) => {
                    // Skip empty headers or provide a fallback value
                    const headerValue = header.trim() || `Column ${index + 1}`;
                    const displayName = header.trim() || `(Empty Column ${index + 1})`;
                    return (
                      <SelectItem key={`vol-col-${index}`} value={headerValue}>
                        {displayName}
                        {csvData.detectedSearchVolumeColumn === header && ' (Auto-detected)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedColumn && (
              <div className="space-y-2">
                <Label>Preview (First 5 keywords)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">#</TableHead>
                        <TableHead>{selectedColumn}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.rows.slice(0, 5).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{row[selectedColumn]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-gray-500">
                  Showing preview of first {Math.min(5, csvData.rows.length)} rows
                  {csvData.rows.length > 5 && ` (${csvData.rows.length} total in preview)`}
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="button"
              onClick={handleConfirm} 
              disabled={!selectedColumn || isDisabled || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm and Analyze Keywords'
              )}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
