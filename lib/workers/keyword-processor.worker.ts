import type { KeywordResult, GroupedKeywordResult } from '@/types/keyword-analysis';

// Message types for worker communication
export interface WorkerMessage {
  type: 'PROCESS_KEYWORDS' | 'CANCEL';
  data?: {
    keywords: KeywordResult[];
    keywordMeta?: Record<string, { searchVolume?: number }>;
  };
}

export interface WorkerResponse {
  type: 'PROGRESS' | 'COMPLETE' | 'ERROR' | 'CANCELLED';
  data?: {
    progress?: number;
    message?: string;
    results?: KeywordResult[];
    groups?: GroupedKeywordResult[];
    error?: string;
  };
}

// Cache for normalized phrases
const normalizationCache = new Map<string, string>();

// Flag for cancellation
let isCancelled = false;

// Common English stop words
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were',
  'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
  'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'about'
]);

function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\"()+*,.:;!?/#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lemmatizeWord(word: string): string {
  let cleaned = word.toLowerCase().trim();
  
  // Handle possessives
  cleaned = cleaned.replace(/['']s$/i, '');
  cleaned = cleaned.replace(/s['']$/i, 's');
  
  // Special cases
  if (cleaned === 'mens') cleaned = 'men';
  if (cleaned === 'womens') cleaned = 'women';
  if (cleaned === 'childrens') cleaned = 'children';
  
  // Handle common plural patterns
  const pluralRules: Array<[RegExp, string]> = [
    [/ies$/i, 'y'],
    [/ves$/i, 'f'],
    [/(s|x|z|ch|sh)es$/i, '$1'],
    [/([^aeiou])ies$/i, '$1y'],
    [/s$/i, ''],
  ];
  
  // Handle -ing endings conservatively
  if (cleaned.endsWith('ing') && cleaned.length > 6) {
    const base = cleaned.slice(0, -3);
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      return base.slice(0, -1);
    }
  }
  
  // Apply plural rules
  for (const [pattern, replacement] of pluralRules) {
    if (pattern.test(cleaned)) {
      return cleaned.replace(pattern, replacement);
    }
  }
  
  return cleaned;
}

function removeStopWords(phrase: string): string[] {
  const tokens = cleanText(phrase).split(' ');
  return tokens.filter(token => !STOP_WORDS.has(token) && token.length > 0);
}

function normalizePhrase(phrase: string): string {
  // Check cache first
  const cached = normalizationCache.get(phrase);
  if (cached !== undefined) return cached;
  
  const meaningfulWords = removeStopWords(phrase);
  const lemmatized = meaningfulWords.map(word => lemmatizeWord(word));
  const normalized = lemmatized.join(' ');
  
  // Cache the result
  normalizationCache.set(phrase, normalized);
  return normalized;
}

// Optimized O(n) grouping algorithm
function groupKeywordsOptimized(
  keywords: KeywordResult[],
  onProgress?: (progress: number, message: string) => void
): GroupedKeywordResult[] {
  const groups = new Map<string, GroupedKeywordResult>();
  const totalKeywords = keywords.length;
  let processedCount = 0;
  let lastProgressUpdate = Date.now();
  
  // Sort by search volume (descending) to pick highest volume as parent
  const sortedKeywords = [...keywords].sort((a, b) => {
    const volumeA = a.searchVolume || 0;
    const volumeB = b.searchVolume || 0;
    return volumeB - volumeA;
  });
  
  for (const keyword of sortedKeywords) {
    if (isCancelled) break;
    
    processedCount++;
    
    // Throttle progress updates to every 100ms
    const now = Date.now();
    if (now - lastProgressUpdate > 100) {
      const progress = Math.floor((processedCount / totalKeywords) * 100);
      onProgress?.(progress, `Grouping keywords... (${processedCount}/${totalKeywords})`);
      lastProgressUpdate = now;
    }
    
    const normalized = normalizePhrase(keyword.keyword);
    
    if (groups.has(normalized)) {
      // Add to existing group as variation
      const group = groups.get(normalized)!;
      group.variations.push(keyword);
      group.totalVariations = group.variations.length;
    } else {
      // Create new group with this keyword as parent
      groups.set(normalized, {
        parent: keyword,
        variations: [],
        lemma: normalized,
        totalVariations: 0
      });
    }
  }
  
  // Convert to array and sort by parent search volume
  return Array.from(groups.values()).sort((a, b) => {
    const volumeA = a.parent.searchVolume || 0;
    const volumeB = b.parent.searchVolume || 0;
    return volumeB - volumeA;
  });
}

// Process keywords with metadata enrichment
function processKeywords(
  keywords: KeywordResult[],
  keywordMeta?: Record<string, { searchVolume?: number }>,
  onProgress?: (progress: number, message: string) => void
): { results: KeywordResult[], groups: GroupedKeywordResult[] } {
  // Enrich with metadata if provided
  let enrichedResults = keywords;
  if (keywordMeta) {
    enrichedResults = keywords.map(r => ({
      ...r,
      searchVolume: keywordMeta[r.keyword?.toString().trim().toLowerCase()]?.searchVolume ?? r.searchVolume,
    }));
  }
  
  // Group keywords using optimized algorithm
  const groups = groupKeywordsOptimized(enrichedResults, onProgress);
  
  return { results: enrichedResults, groups };
}

// Worker message handler
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;
  
  if (type === 'CANCEL') {
    isCancelled = true;
    self.postMessage({
      type: 'CANCELLED',
      data: { message: 'Processing cancelled' }
    } as WorkerResponse);
    return;
  }
  
  if (type === 'PROCESS_KEYWORDS' && data) {
    isCancelled = false;
    normalizationCache.clear(); // Clear cache for new batch
    
    try {
      const { keywords, keywordMeta } = data;
      
      // Send initial progress
      self.postMessage({
        type: 'PROGRESS',
        data: {
          progress: 0,
          message: 'Starting keyword processing...'
        }
      } as WorkerResponse);
      
      // Process keywords with progress updates
      const { results, groups } = processKeywords(
        keywords,
        keywordMeta,
        (progress, message) => {
          if (!isCancelled) {
            self.postMessage({
              type: 'PROGRESS',
              data: { progress, message }
            } as WorkerResponse);
          }
        }
      );
      
      if (isCancelled) {
        self.postMessage({
          type: 'CANCELLED',
          data: { message: 'Processing cancelled' }
        } as WorkerResponse);
      } else {
        // Send completion
        self.postMessage({
          type: 'COMPLETE',
          data: {
            results,
            groups,
            progress: 100,
            message: 'Processing complete'
          }
        } as WorkerResponse);
      }
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      } as WorkerResponse);
    }
  }
});

// Export for TypeScript
export {};