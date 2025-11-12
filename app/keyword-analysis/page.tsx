'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ProductInputComponent } from '@/components/keyword-analysis/product-input';
import { CSVUploadComponent } from '@/components/keyword-analysis/csv-upload';
import { AnalysisProcessComponent } from '@/components/keyword-analysis/analysis-process';
import { VirtualizedResultsTable } from '@/components/keyword-analysis/VirtualizedResultsTable';
import { RootAnalysisTab } from '@/components/keyword-analysis/root-analysis-tab';
import { NegativePhrasesTab } from '@/components/keyword-analysis/negative-phrases-tab';
import { SegmentsTab } from '@/components/keyword-analysis/segments-tab';
import { apiClient, APIClient } from '@/lib/utils/api-client';
import { exportToCSV, exportToExcel } from '@/lib/utils/csv-export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKeywordProcessor } from '@/lib/hooks/useKeywordProcessor';
import type { GroupedKeywordResult } from '@/types/keyword-analysis';
import type {
  ProductInput,
  CSVData,
  AnalysisState,
  KeywordResult,
  KeywordAnalysisResponse,
  AnalysisSummary,
  RootAnalysisResponse,
  RootAnalysisResult,
  RootAnalysisMember,
  Segment
} from '@/types/keyword-analysis';

type Step = 'product' | 'keywords' | 'analysis' | 'results';

export default function KeywordAnalysisPage() {
  const [currentStep, setCurrentStep] = useState<Step>('product');
  const [productInput, setProductInput] = useState<ProductInput | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    progress: 0,
  });
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [groups, setGroups] = useState<GroupedKeywordResult[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rootAnalysis, setRootAnalysis] = useState<RootAnalysisResponse | null>(null);
  const [isRootLoading, setIsRootLoading] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const [resultsTab, setResultsTab] = useState<'scores' | 'roots' | 'negative' | 'segments'>('scores');
  const [rootMemberPayload, setRootMemberPayload] = useState<RootAnalysisMember[]>([]);
  const [negativePhrases, setNegativePhrases] = useState<string[] | null>(null);
  const [isNegativePhrasesLoading, setIsNegativePhrasesLoading] = useState(false);
  const [negativePhrasesError, setNegativePhrasesError] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const { processKeywords, cancelProcessing, state: _processorState } = useKeywordProcessor();

  const handleProductSubmit = useCallback((data: ProductInput) => {
    setProductInput(data);
    setCurrentStep('keywords');
    toast.success('Product information saved');
  }, []);

  const startAnalysis = useCallback(async (
    keywordList: string[],
    keywordMeta?: Record<string, { searchVolume?: number }>,
    csvDataParam?: CSVData | null
  ) => {
    if (!productInput) {
      toast.error('Product information is missing');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisState({
      status: 'uploading',
      progress: 0,
      message: 'Preparing data...',
    });

    // Kick off root analysis in parallel so results tab can hydrate later
    const triggerRootAnalysis = () => {
      if (!csvDataParam) {
        setRootAnalysis(null);
        setRootError('CSV data unavailable for root analysis.');
        return;
      }

      const normalizedKeywordHeader = (() => {
        if (!csvDataParam) return '';
        const target = csvDataParam.selectedKeywordColumn || csvDataParam.detectedKeywordColumn;
        if (!target) return csvDataParam.headers[0];
        return csvDataParam.headers.find((h, idx) => {
          const headerValue = h.trim() || `Column ${idx + 1}`;
          return headerValue === target;
        }) || target;
      })();

      const normalizedVolumeHeader = (() => {
        if (!csvDataParam?.selectedSearchVolumeColumn) return undefined;
        const target = csvDataParam.selectedSearchVolumeColumn;
        return csvDataParam.headers.find((h, idx) => {
          const headerValue = h.trim() || `Column ${idx + 1}`;
          return headerValue === target;
        }) || target;
      })();

      const buildMembersFromRows = (rows: Record<string, string>[]): RootAnalysisMember[] => rows
        .map(row => {
          const keyword = (row?.[normalizedKeywordHeader] ?? '').toString().trim();
          if (!keyword) return null;
          let searchVolume: number | undefined;
          if (normalizedVolumeHeader) {
            const raw = row?.[normalizedVolumeHeader];
            if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
              const parsed = Number(String(raw).replace(/[\s,]/g, ''));
              if (!Number.isNaN(parsed)) {
                searchVolume = parsed;
              }
            }
          } else if (keywordMeta) {
            const metaVal = keywordMeta[keyword.toLowerCase()];
            if (metaVal?.searchVolume !== undefined) {
              searchVolume = metaVal.searchVolume;
            }
          }
          return {
            keyword,
            search_volume: searchVolume ?? null,
          } as RootAnalysisMember;
        })
        .filter((member): member is RootAnalysisMember => member !== null);

      let rootMembers: RootAnalysisMember[] = [];
      if (csvDataParam.allRows && csvDataParam.allRows.length > 0) {
        rootMembers = buildMembersFromRows(csvDataParam.allRows);
      } else if (rootMemberPayload.length > 0) {
        rootMembers = rootMemberPayload;
      } else {
        rootMembers = keywordList.map(keyword => ({
          keyword,
          search_volume: keywordMeta?.[keyword.toLowerCase()]?.searchVolume,
        }));
      }

      setRootMemberPayload(rootMembers);

      if (rootMembers.length === 0) {
        setRootAnalysis(null);
        return;
      }

      setRootAnalysis(null);
      setRootError(null);
      setIsRootLoading(true);

      void (async () => {
        try {
          const response = await apiClient.analyzeKeywordRoots({
            keywords: rootMembers,
          });
          setRootAnalysis(response);
        } catch (error) {
          console.error('Root analysis error:', error);
          setRootError(error instanceof Error ? error.message : 'Failed to load root analysis');
          toast.error('Root analysis failed. View the root tab for details.');
        } finally {
          setIsRootLoading(false);
          // Keep allRows intact for potential future use
        }
      })();
    };

    triggerRootAnalysis();

    // Trigger negative phrases generation in parallel
    const triggerNegativePhrases = () => {
      if (productInput?.mode !== 'asin') {
        setNegativePhrases(null);
        setNegativePhrasesError('Negative phrases require an ASIN');
        return;
      }

      setNegativePhrases(null);
      setNegativePhrasesError(null);
      setIsNegativePhrasesLoading(true);

      void (async () => {
        try {
          const phrases = await apiClient.getNegativePhrases({
            asin: productInput.asin,
            country: productInput.country,
          });
          setNegativePhrases(phrases);
        } catch (error) {
          console.error('Negative phrases error:', error);
          setNegativePhrasesError(error instanceof Error ? error.message : 'Failed to generate negative phrases');
          toast.error('Negative phrases generation failed. View the Negative Phrases tab for details.');
        } finally {
          setIsNegativePhrasesLoading(false);
        }
      })();
    };

    triggerNegativePhrases();

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const startTime = Date.now();
      const totalKeywords = keywordList.length;
      
      setAnalysisState({
        status: 'processing',
        progress: 10,
        message: 'Sending data to server...',
        estimatedTimeRemaining: Math.max(15, totalKeywords * 1.5), // Better initial estimate
      });

      // Helper function for dynamic messages
      const getProgressMessage = (elapsed: number, count: number) => {
        if (elapsed < 3) return 'Sending data to server...';
        if (elapsed < 8) return `Processing ${count} keywords...`;
        if (elapsed < 15) return 'Analyzing keyword relevance...';
        if (elapsed < 25) return 'Computing similarity scores...';
        if (elapsed < 35) return 'Performing deep analysis...';
        if (elapsed < 50) return 'Finalizing results...';
        return 'Processing is taking longer than usual. Please wait...';
      };

      let _intervalCount = 0;
      const progressInterval = setInterval(() => {
        _intervalCount++;
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        setAnalysisState(prev => {
          // If we're at 90% or above, slow down but keep showing activity
          if (prev.progress >= 90) {
            if (prev.progress >= 98) {
              return prev; // Cap at 98% until actually complete
            }
            return {
              ...prev,
              progress: Math.min(98, prev.progress + 0.2),
              estimatedTimeRemaining: undefined, // Hide estimate when nearly done
              message: elapsedSeconds > 45 
                ? 'Almost done, finalizing analysis...'
                : getProgressMessage(elapsedSeconds, totalKeywords),
            };
          }
          
          // More realistic progress calculation
          const expectedDuration = Math.max(20, totalKeywords * 1.5);
          const progressRatio = Math.min(0.9, elapsedSeconds / expectedDuration);
          const targetProgress = 10 + (progressRatio * 80); // 10-90% range
          
          // Smooth progress increase
          const increment = Math.random() * 5 + 2;
          const newProgress = Math.min(90, Math.max(targetProgress, prev.progress + increment));
          
          // Dynamic time estimation that doesn't get stuck
          let remaining;
          if (elapsedSeconds < 10) {
            remaining = Math.max(10, expectedDuration - elapsedSeconds);
          } else {
            // After 10 seconds, base estimate on actual progress rate
            const progressRate = prev.progress / elapsedSeconds;
            const remainingProgress = 100 - prev.progress;
            remaining = Math.ceil(remainingProgress / progressRate);
          }
          
          return {
            ...prev,
            progress: Math.floor(newProgress),
            estimatedTimeRemaining: remaining > 0 ? remaining : undefined,
            message: getProgressMessage(elapsedSeconds, totalKeywords),
          };
        });
      }, 1000); // Update every second for smoother feedback

      console.log(`[DEBUG] Sending ${keywordList.length} keywords to API`);
      
      const response: KeywordAnalysisResponse = await apiClient.analyzeKeywords({
        product: productInput,
        keywords: keywordList,
      });

      clearInterval(progressInterval);
      
      console.log(`[DEBUG] API returned ${response.analysis_results?.length || 0} results`);
      console.log(`[DEBUG] API summary says analyzed: ${response.summary?.analyzed || 0} keywords`);

      // Convert API response to display format
      const displayResults = APIClient.convertToDisplayFormat(response.analysis_results);
      console.log(`[DEBUG] After conversion: ${displayResults.length} display results`);
      
      // Process keywords in worker for grouping and enrichment
      try {
        console.log(`[DEBUG] Sending ${displayResults.length} results to worker for processing`);
        const { results: processedResults, groups: processedGroups } = await processKeywords(
          displayResults,
          keywordMeta || csvDataParam?.keywordMeta
        );
        console.log(`[DEBUG] Worker returned ${processedResults.length} processed results`);
        console.log(`[DEBUG] Worker created ${processedGroups.length} groups`);
        setResults(processedResults);
        setGroups(processedGroups);
        console.log(`[DEBUG] State updated with ${processedResults.length} results`);
      } catch (error) {
        console.error('Worker processing error:', error);
        // Fallback to non-grouped results
        console.log(`[DEBUG] Worker failed, falling back to ${displayResults.length} ungrouped results`);
        setResults(displayResults);
        setGroups([]);
      }
      
      setSummary(response.summary);
      
      setAnalysisState({
        status: 'completed',
        progress: 100,
        message: 'Analysis completed successfully!',
      });

      // Check for discrepancy
      if (keywordList.length !== response.summary.analyzed) {
        console.warn(`[WARNING] Keyword count mismatch! Sent: ${keywordList.length}, Analyzed: ${response.summary.analyzed}`);
        toast.warning(`Note: Sent ${keywordList.length} keywords but only ${response.summary.analyzed} were analyzed`);
      }
      
      setTimeout(() => {
        setCurrentStep('results');
        toast.success(`Analysis completed! Analyzed ${response.summary.analyzed} keywords with average score ${response.summary.average_score.toFixed(1)}/10`);
      }, 1000);

    } catch (error) {
      console.error('Analysis error - Full details:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && 'cause' in error) {
        console.error('Error cause:', error.cause);
      }

      // Use mock data for demo if API fails
      let mockResults: KeywordResult[] = keywordList.map((keyword) => ({
        keyword,
        type: ['generic', 'our_brand', 'competitor_brand'][Math.floor(Math.random() * 3)] as 'generic' | 'our_brand' | 'competitor_brand',
        score: Math.floor(Math.random() * 10) + 1,
        relevance: Math.floor(Math.random() * 100),
        reasoning: `Mock analysis for "${keyword}": This is demo data as the API is not connected.`,
        analysis: `Mock analysis for "${keyword}": This is demo data as the API is not connected.`,
      }));

      const meta2 = keywordMeta || csvDataParam?.keywordMeta;
      if (meta2) {
        mockResults = mockResults.map(r => ({
          ...r,
          searchVolume: meta2?.[r.keyword?.toString().trim().toLowerCase()]?.searchVolume ?? r.searchVolume,
        }));
      }

      const mockSummary: AnalysisSummary = {
        total_keywords: keywordList.length,
        analyzed: mockResults.length,
        failed: 0,
        by_type: {
          generic: mockResults.filter(r => r.type === 'generic').length,
          our_brand: mockResults.filter(r => r.type === 'our_brand').length,
          competitor_brand: mockResults.filter(r => r.type === 'competitor_brand').length,
        },
        average_score: mockResults.length > 0 ? mockResults.reduce((acc, r) => acc + r.score, 0) / mockResults.length : 0,
        processing_time: 2.5,
      };

      // Process mock results through worker
      try {
        const { results: processedResults, groups: processedGroups } = await processKeywords(
          mockResults,
          meta2
        );
        setResults(processedResults);
        setGroups(processedGroups);
      } catch (error) {
        console.error('Worker processing error:', error);
        setResults(mockResults);
        setGroups([]);
      }
      setSummary(mockSummary);
      
      setAnalysisState({
        status: 'completed',
        progress: 100,
        message: 'Using mock data (API not connected)',
      });

      setTimeout(() => {
        setCurrentStep('results');
        toast.info('Using mock data for demonstration (API not connected)');
      }, 1000);
    } finally {
      setIsAnalyzing(false);
    }
  }, [productInput, processKeywords, rootMemberPayload]);

  const handleCSVUpload = useCallback((uploadedKeywords: string[], uploadedCSVData: CSVData) => {
    if (!productInput) {
      toast.error('Please complete product information first');
      setCurrentStep('product');
      return;
    }
    
    setKeywords(uploadedKeywords);
    setCSVData(uploadedCSVData);
    setRootAnalysis(null);
    setRootError(null);
    setIsRootLoading(false);
    setResultsTab('scores');
    setRootMemberPayload([]);
    setNegativePhrases(null);
    setIsNegativePhrasesLoading(false);
    setNegativePhrasesError(null);
    toast.success(`${uploadedKeywords.length} keywords loaded`);
    setCurrentStep('analysis');

    setTimeout(() => {
      startAnalysis(uploadedKeywords, uploadedCSVData.keywordMeta, uploadedCSVData);
    }, 500);
  }, [productInput, startAnalysis]);

  const handleCancelAnalysis = useCallback(() => {
    apiClient.cancelAnalysis();
    cancelProcessing();
    setIsAnalyzing(false);
    setAnalysisState({
      status: 'idle',
      progress: 0,
    });
    setIsRootLoading(false);
    setRootAnalysis(null);
    setRootError('Root analysis cancelled');
    setRootMemberPayload([]);
    setNegativePhrases(null);
    setIsNegativePhrasesLoading(false);
    setNegativePhrasesError('Negative phrases generation cancelled');
    setCSVData(prev => (prev ? { ...prev, allRows: undefined } : prev));
    toast.info('Analysis cancelled');
  }, [cancelProcessing]);

  const handleRetryAnalysis = useCallback(() => {
    if (keywords.length > 0) {
      startAnalysis(keywords, csvData?.keywordMeta, csvData);
    }
  }, [keywords, startAnalysis, csvData]);

  const handleExport = useCallback((format: 'csv' | 'xlsx', customData?: KeywordResult[]) => {
    // Use custom data if provided (for grouped exports), otherwise use all results
    const dataToExport = customData || results;
    
    if (dataToExport.length === 0) {
      toast.error('No results to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const exportMode = customData && customData.length < results.length ? 'grouped' : 'all';
    const filename = `keyword-analysis-${exportMode}-${timestamp}`;

    // Prepare export data with all fields (excluding relevance)
    const exportData = dataToExport.map(result => ({
      keyword: result.keyword,
      type: result.type,
      score: result.score,
      searchVolume: result.searchVolume,
      reasoning: result.reasoning,
    }));

    if (format === 'csv') {
      exportToCSV(exportData as KeywordResult[], `${filename}.csv`);
      toast.success(`CSV exported successfully (${exportMode === 'grouped' ? 'parent keywords only' : 'all keywords'})`);
    } else {
      exportToExcel(exportData as KeywordResult[], filename);
      toast.success(`Excel file exported successfully (${exportMode === 'grouped' ? 'parent keywords only' : 'all keywords'})`);
    }
  }, [results]);

  const handleRootExport = useCallback((root: RootAnalysisResult) => {
    if (!root.members || root.members.length === 0) {
      toast.error('No keywords to export for this root');
      return;
    }

    // Create a set of member keywords (case-insensitive) for faster lookup
    const memberKeywords = new Set(
      root.members.map(member => member.keyword.toLowerCase())
    );

    // Filter results to only include keywords that are members of this root
    const rootResults = results.filter(result =>
      memberKeywords.has(result.keyword.toLowerCase())
    );

    if (rootResults.length === 0) {
      toast.error('No analyzed results found for this root');
      return;
    }

    const sanitizedName = root.normalized_term
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'root-keywords';

    // Use the standard export function with filtered results
    exportToCSV(rootResults, `${sanitizedName}-keywords.csv`);
    toast.success(`Exported ${rootResults.length} keywords for "${root.normalized_term}"`);
  }, [results]);

  const handleStartNew = useCallback(() => {
    setCurrentStep('product');
    setProductInput(null);
    setKeywords([]);
    setCSVData(null);
    setAnalysisState({ status: 'idle', progress: 0 });
    setResults([]);
    setGroups([]);
    setSummary(null);
    setIsAnalyzing(false);
    setRootAnalysis(null);
    setIsRootLoading(false);
    setRootError(null);
    setResultsTab('scores');
    setRootMemberPayload([]);
    setNegativePhrases(null);
    setIsNegativePhrasesLoading(false);
    setNegativePhrasesError(null);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Keyword Analysis Tool</h1>
        <p className="text-gray-600">
          Analyze keyword relevance and performance for your products
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {['product', 'keywords', 'analysis', 'results'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-medium
                    ${currentStep === step ? 'bg-blue-500 text-white' : ''}
                    ${['product', 'keywords', 'analysis', 'results'].indexOf(currentStep) > index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'}
                  `}
                >
                  {['product', 'keywords', 'analysis', 'results'].indexOf(currentStep) > index ? '✓' : index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`
                      w-20 h-1 mx-2
                      ${['product', 'keywords', 'analysis', 'results'].indexOf(currentStep) > index
                        ? 'bg-green-500'
                        : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          {currentStep === 'results' && (
            <button
              onClick={handleStartNew}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Start New Analysis
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {currentStep === 'product' && (
          <ProductInputComponent 
            onSubmit={handleProductSubmit}
            isDisabled={isAnalyzing}
          />
        )}

        {currentStep === 'keywords' && (
          <CSVUploadComponent
            onUpload={handleCSVUpload}
            isDisabled={isAnalyzing}
          />
        )}

        {currentStep === 'analysis' && (
          <AnalysisProcessComponent
            isAnalyzing={isAnalyzing}
            analysisState={analysisState}
            onCancel={handleCancelAnalysis}
            onRetry={handleRetryAnalysis}
          />
        )}

        {currentStep === 'results' && (
          <Tabs
            value={resultsTab}
            onValueChange={value => setResultsTab(value as 'scores' | 'roots' | 'negative' | 'segments')}
          >
            <TabsList>
              <TabsTrigger value="scores">Keyword Scores</TabsTrigger>
              <TabsTrigger value="roots">Root Keywords</TabsTrigger>
              <TabsTrigger value="negative">Negative Phrases</TabsTrigger>
              <TabsTrigger value="segments">Segments</TabsTrigger>
            </TabsList>
            <TabsContent value="scores">
              <VirtualizedResultsTable
                results={results}
                groups={groups}
                onExport={handleExport}
                summary={summary ? {
                  average_score: summary.average_score,
                  total_keywords: summary.total_keywords,
                  by_type: summary.by_type,
                } : undefined}
              />
            </TabsContent>
            <TabsContent value="roots">
              <RootAnalysisTab
                data={rootAnalysis}
                isLoading={isRootLoading}
                error={rootError}
                onExportRoot={handleRootExport}
              />
            </TabsContent>
            <TabsContent value="negative">
              <NegativePhrasesTab
                phrases={negativePhrases}
                isLoading={isNegativePhrasesLoading}
                error={negativePhrasesError}
              />
            </TabsContent>
            <TabsContent value="segments">
              <SegmentsTab
                groups={groups}
                segments={segments}
                onSegmentsChange={setSegments}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
