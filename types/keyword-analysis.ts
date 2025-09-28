export type InputMode = 'asin' | 'description';

export type CountryCode = 'US' | 'UK' | 'DE' | 'FR' | 'JP' | 'CA' | 'IT' | 'ES' | 'IN' | 'MX' | 'BR' | 'AU' | 'NL';

export interface ProductInputASIN {
  mode: 'asin';
  asin: string;
  country: CountryCode;
}

export interface ProductInputDescription {
  mode: 'description';
  description: string;
}

export type ProductInput = ProductInputASIN | ProductInputDescription;

export interface KeywordAnalysisRequest {
  product: ProductInput;
  keywords: string[];
}

// API Response Types based on documentation
export interface ProductInfo {
  asin: string | null;
  brand: string | null;
  product_title: string | null;
  product_features: string | null;
  description: string | null;
  main_image_url: string | null;
  gallery_image_urls: string[] | null;
  category_tree: Array<{
    catId: number;
    name: string;
  }> | null;
  cat_id: number | null;
  category_name: string | null;
  parent_asin: string | null;
  review_count: number | null;
  rating: number | null;
  sales_rank: number | null;
  price: number | null;
  category_attributes: Record<string, string> | null;
  raw_description: string | null;
}

export interface KeywordAnalysisResult {
  keyword: string;
  type: 'generic' | 'our_brand' | 'competitor_brand';
  score: number;
  reasoning: string;
}

export interface AnalysisSummary {
  total_keywords: number;
  analyzed: number;
  failed: number;
  by_type: {
    generic: number;
    our_brand: number;
    competitor_brand: number;
  };
  average_score: number;
  processing_time: number;
}

export interface KeywordAnalysisResponse {
  input_type: 'asin' | 'description';
  product_info: ProductInfo;
  analysis_results: KeywordAnalysisResult[];
  summary: AnalysisSummary;
  errors: string[] | null;
}

// Frontend-specific types for display
export interface KeywordResult {
  keyword: string;
  type: 'generic' | 'our_brand' | 'competitor_brand';
  score: number;
  reasoning: string;
  relevance: number; // Convert score to percentage for display
  searchVolume?: number; // Optional, for future enhancement
  competition?: 'low' | 'medium' | 'high'; // Optional, for future enhancement
  suggestedBid?: number; // Optional, for future enhancement
  analysis?: string; // Maps to reasoning
}

export interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
  allRows?: Record<string, string>[];
  detectedKeywordColumn?: string;
  detectedSearchVolumeColumn?: string;
  selectedKeywordColumn?: string;
  selectedSearchVolumeColumn?: string;
  // Mapping from keyword to associated metadata extracted from CSV
  keywordMeta?: Record<string, { searchVolume?: number }>;
}

export interface RootAnalysisMember {
  keyword: string;
  search_volume?: number | null;
}

export interface RootAnalysisResult {
  normalized_term: string;
  frequency: number;
  search_volume?: number;
  relative_volume?: number;
  members: RootAnalysisMember[];
}

export interface RootAnalysisResponse {
  mode: 'full' | 'simple';
  total_keywords: number;
  results: RootAnalysisResult[];
  auto_config_updates?: {
    new_stopwords?: string[];
    new_irregular_singulars?: Record<string, string>;
  };
}

export interface AnalysisState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message?: string;
  estimatedTimeRemaining?: number;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx';
  includeOriginalData: boolean;
  includeAnalysis: boolean;
}

// Grouped keyword types for aggregation
export interface GroupedKeywordResult {
  parent: KeywordResult;
  variations: KeywordResult[];
  lemma: string;
  totalVariations: number;
}

// Negative Phrase types
export interface NegativePhraseRequest {
  asin: string;
  country?: CountryCode;
}

export type NegativePhraseResponse = string[];
