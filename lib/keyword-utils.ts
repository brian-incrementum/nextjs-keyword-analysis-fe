/**
 * Utility functions for keyword aggregation and grouping
 */

// Common English stop words that don't affect keyword meaning
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

/**
 * Clean text by removing special characters and normalizing spaces
 * Preserves apostrophes for possessives but removes other punctuation
 */
export function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\"()+*,.:;!?/#]/g, ' ')  // Keep apostrophes for now
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple lemmatization for common English word patterns
 * Focuses on plural/singular conversions
 */
export function lemmatizeWord(word: string): string {
  let cleaned = word.toLowerCase().trim();
  
  // Handle possessives first
  // men's -> men, mens -> men, women's -> women
  cleaned = cleaned.replace(/['']s$/i, '');  // Remove 's or 's at end
  cleaned = cleaned.replace(/s['']$/i, 's'); // Keep s if it's s' (like boys')
  
  // Special case: "mens" without apostrophe is often a typo for "men's"
  // Same with womens, childrens, etc.
  if (cleaned === 'mens') cleaned = 'men';
  if (cleaned === 'womens') cleaned = 'women';
  if (cleaned === 'childrens') cleaned = 'children';
  
  // Handle common plural patterns
  const pluralRules: Array<[RegExp, string]> = [
    [/ies$/i, 'y'],        // cities -> city
    [/ves$/i, 'f'],        // leaves -> leaf  
    [/(s|x|z|ch|sh)es$/i, '$1'], // boxes -> box, dishes -> dish
    [/([^aeiou])ies$/i, '$1y'], // puppies -> puppy
    [/s$/i, ''],           // cats -> cat
  ];
  
  // Handle -ing endings (but be careful not to over-lemmatize)
  // We're more conservative here to avoid changing meaning
  if (cleaned.endsWith('ing') && cleaned.length > 6) {
    // Only lemmatize clear cases like "running" -> "run"
    const base = cleaned.slice(0, -3);
    if (base.length > 2) {
      // Check for doubled consonant (running -> run)
      if (base[base.length - 1] === base[base.length - 2]) {
        return base.slice(0, -1);
      }
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

/**
 * Remove stop words from a phrase while preserving order
 */
export function removeStopWords(phrase: string): string[] {
  const tokens = cleanText(phrase).split(' ');
  return tokens.filter(token => !STOP_WORDS.has(token) && token.length > 0);
}

/**
 * Normalize a phrase for comparison by removing stop words and lemmatizing
 * Preserves word order for phrase matching
 */
export function normalizePhrase(phrase: string): string {
  const meaningfulWords = removeStopWords(phrase);
  const lemmatized = meaningfulWords.map(word => lemmatizeWord(word));
  return lemmatized.join(' ');
}

/**
 * Lemmatize a phrase by lemmatizing each word (legacy function kept for compatibility)
 */
export function lemmatizePhrase(phrase: string): string {
  const tokens = cleanText(phrase).split(' ');
  return tokens.map(token => lemmatizeWord(token)).join(' ');
}

/**
 * Calculate similarity between two phrases (legacy function kept for compatibility)
 * Returns a score between 0 and 1
 */
export function phraseSimilarity(phrase1: string, phrase2: string): number {
  const normalized1 = normalizePhrase(phrase1);
  const normalized2 = normalizePhrase(phrase2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return 1;
  
  // No match if normalized phrases differ
  return 0;
}

/**
 * Check if two keywords are variations of each other using strict phrase matching
 * Only groups keywords that are truly the same phrase (plural/singular + stop words)
 */
export function areKeywordVariations(keyword1: string, keyword2: string): boolean {
  // Normalize both keywords (remove stop words, lemmatize, preserve order)
  const normalized1 = normalizePhrase(keyword1);
  const normalized2 = normalizePhrase(keyword2);
  
  // They must be identical after normalization to be considered variations
  return normalized1 === normalized2 && normalized1.length > 0;
}