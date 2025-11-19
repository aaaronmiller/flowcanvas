import { cmudict } from './cmudict';

export interface RhymeMatch {
  word: string;
  phonemes: string[];
  type: 'perfect' | 'near' | 'assonance' | 'consonance' | 'slant';
  distance: number;
  score: number;
}

export class RhymeEngine {
  private usedWords: Set<string> = new Set();
  private usageHistory: Map<string, number> = new Map();

  constructor() {}

  // Mark a word as used
  markUsed(word: string): void {
    const key = word.toLowerCase();
    this.usedWords.add(key);
    const count = this.usageHistory.get(key) || 0;
    this.usageHistory.set(key, count + 1);
  }

  // Check if a word has been used
  isUsed(word: string): boolean {
    return this.usedWords.has(word.toLowerCase());
  }

  // Get usage count for a word
  getUsageCount(word: string): number {
    return this.usageHistory.get(word.toLowerCase()) || 0;
  }

  // Reset usage tracking
  resetUsage(): void {
    this.usedWords.clear();
    this.usageHistory.clear();
  }

  // Find rhymes for a word
  findRhymes(word: string, options: {
    maxResults?: number;
    includeUsed?: boolean;
    minScore?: number;
  } = {}): RhymeMatch[] {
    const {
      maxResults = 50,
      includeUsed = false,
      minScore = 0.3,
    } = options;

    const phonemeSets = cmudict.getPhonemes(word);
    if (phonemeSets.length === 0) {
      // Use G2P fallback
      const generated = cmudict.graphemeToPhoneme(word);
      phonemeSets.push(generated);
    }

    const allWords = cmudict.getAllWords();
    const matches: RhymeMatch[] = [];

    for (const candidateWord of allWords) {
      if (candidateWord === word.toLowerCase()) continue;
      if (!includeUsed && this.isUsed(candidateWord)) continue;

      const candidatePhonemes = cmudict.getPhonemes(candidateWord);
      if (candidatePhonemes.length === 0) continue;

      // Compare with all pronunciation variants
      for (const sourcePhonemes of phonemeSets) {
        for (const targetPhonemes of candidatePhonemes) {
          const match = this.comparePhonemes(sourcePhonemes, targetPhonemes);
          if (match.score >= minScore) {
            matches.push({
              word: candidateWord,
              phonemes: targetPhonemes,
              type: match.type,
              distance: match.distance,
              score: match.score,
            });
          }
        }
      }
    }

    // Sort by score (descending) and usage (prefer unused)
    matches.sort((a, b) => {
      const usageA = this.getUsageCount(a.word);
      const usageB = this.getUsageCount(b.word);

      // Penalize used words
      const scoreA = a.score - (usageA * 0.1);
      const scoreB = b.score - (usageB * 0.1);

      return scoreB - scoreA;
    });

    return matches.slice(0, maxResults);
  }

  // Compare two phoneme sequences
  private comparePhonemes(phonemes1: string[], phonemes2: string[]): {
    type: RhymeMatch['type'];
    distance: number;
    score: number;
  } {
    // Extract the rhyme nucleus (stressed vowel and everything after)
    const nucleus1 = this.extractRhymeNucleus(phonemes1);
    const nucleus2 = this.extractRhymeNucleus(phonemes2);

    // Perfect rhyme: same nucleus
    if (this.arraysEqual(nucleus1, nucleus2)) {
      return { type: 'perfect', distance: 0, score: 1.0 };
    }

    // Calculate phonetic distance
    const distance = this.phoneticDistance(nucleus1, nucleus2);
    const similarityScore = 1 - (distance / Math.max(nucleus1.length, nucleus2.length, 1));

    // Classify rhyme type
    if (similarityScore > 0.8) {
      return { type: 'near', distance, score: similarityScore };
    }

    // Check for assonance (vowel similarity)
    const vowels1 = this.extractVowels(phonemes1);
    const vowels2 = this.extractVowels(phonemes2);
    if (this.arraysEqual(vowels1, vowels2)) {
      return { type: 'assonance', distance, score: 0.7 };
    }

    // Check for consonance (consonant similarity)
    const consonants1 = this.extractConsonants(phonemes1);
    const consonants2 = this.extractConsonants(phonemes2);
    const consonantSimilarity = this.consonantSimilarity(consonants1, consonants2);
    if (consonantSimilarity > 0.7) {
      return { type: 'consonance', distance, score: 0.6 };
    }

    // Slant rhyme
    if (similarityScore > 0.4) {
      return { type: 'slant', distance, score: similarityScore };
    }

    return { type: 'slant', distance, score: similarityScore };
  }

  // Extract rhyme nucleus (stressed vowel + trailing phonemes)
  private extractRhymeNucleus(phonemes: string[]): string[] {
    // Find last stressed vowel
    let lastStressedIndex = -1;
    for (let i = phonemes.length - 1; i >= 0; i--) {
      if (this.isStressedVowel(phonemes[i])) {
        lastStressedIndex = i;
        break;
      }
    }

    if (lastStressedIndex === -1) {
      // No stressed vowel found, use last vowel
      for (let i = phonemes.length - 1; i >= 0; i--) {
        if (this.isVowel(phonemes[i])) {
          lastStressedIndex = i;
          break;
        }
      }
    }

    return lastStressedIndex >= 0
      ? phonemes.slice(lastStressedIndex)
      : phonemes;
  }

  // Extract vowels from phoneme sequence
  private extractVowels(phonemes: string[]): string[] {
    return phonemes.filter(p => this.isVowel(p));
  }

  // Extract consonants from phoneme sequence
  private extractConsonants(phonemes: string[]): string[] {
    return phonemes.filter(p => !this.isVowel(p));
  }

  // Check if phoneme is a vowel
  private isVowel(phoneme: string): boolean {
    const base = phoneme.replace(/[0-2]/g, '');
    return ['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'].includes(base);
  }

  // Check if phoneme is a stressed vowel
  private isStressedVowel(phoneme: string): boolean {
    return this.isVowel(phoneme) && (phoneme.endsWith('1') || phoneme.endsWith('2'));
  }

  // Calculate phonetic distance between two phoneme sequences
  private phoneticDistance(phonemes1: string[], phonemes2: string[]): number {
    // Simple Levenshtein distance
    const m = phonemes1.length;
    const n = phonemes2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (this.phonemesEqual(phonemes1[i - 1], phonemes2[j - 1])) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1]  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  // Check if two phonemes are equal (ignoring stress)
  private phonemesEqual(p1: string, p2: string): boolean {
    const base1 = p1.replace(/[0-2]/g, '');
    const base2 = p2.replace(/[0-2]/g, '');
    return base1 === base2;
  }

  // Calculate consonant similarity
  private consonantSimilarity(cons1: string[], cons2: string[]): number {
    if (cons1.length === 0 && cons2.length === 0) return 1;
    if (cons1.length === 0 || cons2.length === 0) return 0;

    let matches = 0;
    const maxLen = Math.max(cons1.length, cons2.length);

    for (let i = 0; i < Math.min(cons1.length, cons2.length); i++) {
      if (this.phonemesEqual(cons1[i], cons2[i])) {
        matches++;
      }
    }

    return matches / maxLen;
  }

  // Check array equality
  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, idx) => this.phonemesEqual(val, arr2[idx]));
  }

  // Get phonetic distance for ranking
  getPhoneticDistance(word1: string, word2: string): number {
    const phonemes1 = cmudict.getPhonemes(word1);
    const phonemes2 = cmudict.getPhonemes(word2);

    if (phonemes1.length === 0 || phonemes2.length === 0) return 999;

    let minDistance = Infinity;
    for (const p1 of phonemes1) {
      for (const p2 of phonemes2) {
        const dist = this.phoneticDistance(p1, p2);
        minDistance = Math.min(minDistance, dist);
      }
    }

    return minDistance;
  }
}
