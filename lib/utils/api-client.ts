import type {
  KeywordAnalysisRequest,
  KeywordAnalysisResponse,
  KeywordResult,
  KeywordAnalysisResult,
  RootAnalysisResponse,
  RootAnalysisMember,
  NegativePhraseRequest,
  NegativePhraseResponse
} from '@/types/keyword-analysis';

export class APIClient {
  private baseURL: string;
  private abortController: AbortController | null = null;
  private rootAbortController: AbortController | null = null;
  private negativePhraseAbortController: AbortController | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001') {
    this.baseURL = baseURL;
  }

  async analyzeKeywords(request: KeywordAnalysisRequest): Promise<KeywordAnalysisResponse> {
    this.abortController = new AbortController();

    try {
      const payload = this.buildPayload(request);
      
      const response = await fetch(`${this.baseURL}/analyze-keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage = typeof error.detail === 'string' ? error.detail
          : typeof error.message === 'string' ? error.message
          : error.detail ? JSON.stringify(error.detail)
          : `Analysis failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate and fix scores to be within 1-10 range
      if (data.analysis_results) {
        data.analysis_results = data.analysis_results.map((result: KeywordAnalysisResult) => ({
          ...result,
          score: Math.max(1, Math.min(10, result.score || 1))
        }));
        
        // Recalculate average score if needed
        if (data.summary && data.analysis_results.length > 0) {
          const totalScore = data.analysis_results.reduce((sum: number, r: KeywordAnalysisResult) => sum + r.score, 0);
          data.summary.average_score = totalScore / data.analysis_results.length;
        }
      }
      
      return data as KeywordAnalysisResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Analysis was cancelled');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred during analysis');
    } finally {
      this.abortController = null;
    }
  }

  cancelAnalysis(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.rootAbortController) {
      this.rootAbortController.abort();
      this.rootAbortController = null;
    }
    if (this.negativePhraseAbortController) {
      this.negativePhraseAbortController.abort();
      this.negativePhraseAbortController = null;
    }
  }

  async analyzeKeywordRoots(request: {
    mode?: 'full' | 'simple';
    keywords: RootAnalysisMember[];
  }): Promise<RootAnalysisResponse> {
    this.rootAbortController = new AbortController();

    try {
      const response = await fetch(`${this.baseURL}/root-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'full', ...request }),
        signal: this.rootAbortController.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage = typeof error.detail === 'string' ? error.detail
          : typeof error.message === 'string' ? error.message
          : error.detail ? JSON.stringify(error.detail)
          : `Root analysis failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return (await response.json()) as RootAnalysisResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Root analysis was cancelled');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred during root analysis');
    } finally {
      this.rootAbortController = null;
    }
  }

  async getNegativePhrases(request: NegativePhraseRequest): Promise<NegativePhraseResponse> {
    this.negativePhraseAbortController = new AbortController();

    try {
      const response = await fetch(`${this.baseURL}/negative-phrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asin: request.asin,
          country: request.country || 'US',
        }),
        signal: this.negativePhraseAbortController.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errorMessage = typeof error.detail === 'string' ? error.detail
          : typeof error.message === 'string' ? error.message
          : error.detail ? JSON.stringify(error.detail)
          : `Negative phrase generation failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return (await response.json()) as NegativePhraseResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Negative phrase generation was cancelled');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred during negative phrase generation');
    } finally {
      this.negativePhraseAbortController = null;
    }
  }

  private buildPayload(request: KeywordAnalysisRequest): Record<string, unknown> {
    const { product, keywords } = request;
    
    if (product.mode === 'asin') {
      return {
        asin: product.asin,
        country: product.country,
        keywords: keywords,
      };
    } else {
      return {
        product_description: product.description,
        keywords: keywords,
      };
    }
  }

  // Convert API response format to frontend display format
  static convertToDisplayFormat(apiResults: KeywordAnalysisResult[]): KeywordResult[] {
    return apiResults.map(result => ({
      keyword: result.keyword,
      type: result.type,
      score: Math.max(1, Math.min(10, result.score || 1)), // Ensure score is between 1-10
      reasoning: result.reasoning,
      relevance: Math.max(1, Math.min(10, result.score || 1)) * 10, // Convert 1-10 score to percentage
      analysis: result.reasoning,
    }));
  }
}

export const apiClient = new APIClient();
