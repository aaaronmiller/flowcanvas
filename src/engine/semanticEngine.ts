import Compromise from 'compromise';

export interface SemanticMatch {
  word: string;
  similarity: number;
  category: 'safe' | 'wacky' | 'wild';
  metaphorScore: number;
}

export interface Entity {
  text: string;
  type: 'person' | 'place' | 'thing' | 'concept';
  timestamp: number;
}

export interface StoryThread {
  id: string;
  entities: Entity[];
  theme: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  open: boolean;
  createdAt: number;
  lastUpdated: number;
}

export class SemanticEngine {
  private seedText: string = '';
  private seedWords: Set<string> = new Set();
  private entities: Entity[] = [];
  private threads: StoryThread[] = [];
  private themeMap: Map<string, number> = new Map();

  constructor() {}

  // Set weird seed text
  setSeedText(text: string): void {
    this.seedText = text;
    this.seedWords.clear();

    // Extract significant words from seed
    const doc = Compromise(text);
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    const adjectives = doc.adjectives().out('array');

    [...nouns, ...verbs, ...adjectives].forEach(word => {
      this.seedWords.add(word.toLowerCase());
    });
  }

  // Find semantically related words from seed
  findSemanticMatches(
    currentWord: string,
    weirdnessLevel: number = 0.5
  ): SemanticMatch[] {
    if (this.seedWords.size === 0) {
      return [];
    }

    const matches: SemanticMatch[] = [];
    const currentDoc = Compromise(currentWord);
    const currentType = this.getWordType(currentDoc);

    // Simple semantic matching based on word relationships
    for (const seedWord of this.seedWords) {
      const seedDoc = Compromise(seedWord);
      const seedType = this.getWordType(seedDoc);

      // Calculate similarity (simplified - in production use word embeddings)
      const similarity = this.calculateWordSimilarity(
        currentWord,
        seedWord,
        currentType,
        seedType
      );

      if (similarity > 0) {
        const metaphorScore = this.calculateMetaphorPotential(currentWord, seedWord);
        const category = this.categorizeWeirdness(similarity, weirdnessLevel, metaphorScore);

        matches.push({
          word: seedWord,
          similarity,
          category,
          metaphorScore,
        });
      }
    }

    // Sort by similarity and weirdness preference
    matches.sort((a, b) => {
      const scoreA = this.getCategoryScore(a.category, weirdnessLevel) + a.similarity;
      const scoreB = this.getCategoryScore(b.category, weirdnessLevel) + b.similarity;
      return scoreB - scoreA;
    });

    return matches.slice(0, 20);
  }

  // Generate compound phrases (Seed Mixer)
  generateCompounds(words: string[]): string[] {
    const compounds: string[] = [];

    // Combine seed words with transcript words
    const seedArray = Array.from(this.seedWords);

    for (const word1 of words.slice(-10)) {
      for (const word2 of seedArray.slice(0, 20)) {
        // Various combination strategies
        compounds.push(`${word1}-${word2}`);
        compounds.push(`${word2}-${word1}`);

        // Portmanteaus (blend words)
        const portmanteau1 = this.createPortmanteau(word1, word2);
        const portmanteau2 = this.createPortmanteau(word2, word1);

        if (portmanteau1) compounds.push(portmanteau1);
        if (portmanteau2) compounds.push(portmanteau2);
      }
    }

    return compounds.slice(0, 30);
  }

  // Create portmanteau from two words
  private createPortmanteau(word1: string, word2: string): string | null {
    if (word1.length < 3 || word2.length < 3) return null;

    // Find overlap or blend point
    for (let overlap = Math.min(3, word1.length - 1); overlap >= 1; overlap--) {
      const end1 = word1.slice(-overlap);
      const start2 = word2.slice(0, overlap);

      if (end1.toLowerCase() === start2.toLowerCase()) {
        return word1 + word2.slice(overlap);
      }
    }

    // Simple blend if no overlap
    const split = Math.floor(word1.length * 0.6);
    return word1.slice(0, split) + word2.slice(Math.floor(word2.length * 0.4));
  }

  // Extract entities from text (NLP)
  extractEntities(text: string, timestamp: number): Entity[] {
    const doc = Compromise(text);
    const entities: Entity[] = [];

    // People
    const people = doc.people().out('array');
    people.forEach(person => {
      entities.push({ text: person, type: 'person', timestamp });
    });

    // Places
    const places = doc.places().out('array');
    places.forEach(place => {
      entities.push({ text: place, type: 'place', timestamp });
    });

    // Things (nouns)
    const things = doc.nouns().out('array').slice(0, 10);
    things.forEach(thing => {
      if (!people.includes(thing) && !places.includes(thing)) {
        entities.push({ text: thing, type: 'thing', timestamp });
      }
    });

    this.entities.push(...entities);
    return entities;
  }

  // Detect story threads
  updateStoryThreads(text: string, timestamp: number): StoryThread[] {
    const entities = this.extractEntities(text, timestamp);

    // Check if entities belong to existing threads or create new ones
    for (const entity of entities) {
      let foundThread = false;

      for (const thread of this.threads) {
        if (this.entityBelongsToThread(entity, thread)) {
          thread.entities.push(entity);
          thread.lastUpdated = timestamp;
          foundThread = true;
          break;
        }
      }

      if (!foundThread) {
        // Create new thread
        const newThread: StoryThread = {
          id: `thread-${Date.now()}-${Math.random()}`,
          entities: [entity],
          theme: entity.text,
          sentiment: this.detectSentiment(text),
          open: true,
          createdAt: timestamp,
          lastUpdated: timestamp,
        };
        this.threads.push(newThread);
      }
    }

    return this.threads;
  }

  // Check if entity belongs to a story thread
  private entityBelongsToThread(entity: Entity, thread: StoryThread): boolean {
    // Check if entity type matches
    const sameTypeEntities = thread.entities.filter(e => e.type === entity.type);
    if (sameTypeEntities.length === 0) return false;

    // Check if entity is related (same or similar text)
    return sameTypeEntities.some(e =>
      e.text.toLowerCase() === entity.text.toLowerCase() ||
      e.text.toLowerCase().includes(entity.text.toLowerCase()) ||
      entity.text.toLowerCase().includes(e.text.toLowerCase())
    );
  }

  // Detect sentiment
  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const doc = Compromise(text);

    const positiveWords = doc.match('#Positive').length;
    const negativeWords = doc.match('#Negative').length;

    if (positiveWords > negativeWords) return 'positive';
    if (negativeWords > positiveWords) return 'negative';
    return 'neutral';
  }

  // Get open threads
  getOpenThreads(): StoryThread[] {
    return this.threads.filter(t => t.open);
  }

  // Close a thread
  closeThread(threadId: string): void {
    const thread = this.threads.find(t => t.id === threadId);
    if (thread) {
      thread.open = false;
    }
  }

  // Calculate metaphor potential
  calculateMetaphorPotential(word1: string, word2: string): number {
    const doc1 = Compromise(word1);
    const doc2 = Compromise(word2);

    const type1 = this.getWordType(doc1);
    const type2 = this.getWordType(doc2);

    // Abstract + Concrete = high metaphor potential
    const abstract1 = this.isAbstract(word1);
    const abstract2 = this.isAbstract(word2);

    if (abstract1 !== abstract2) return 0.9;

    // Same category but different domains
    if (type1 === type2 && type1 !== 'unknown') return 0.6;

    return 0.3;
  }

  // Check if word is abstract
  private isAbstract(word: string): boolean {
    const abstractConcepts = [
      'love', 'hate', 'fear', 'joy', 'pain', 'hope', 'dream', 'time',
      'truth', 'freedom', 'justice', 'power', 'soul', 'mind', 'spirit'
    ];
    return abstractConcepts.some(concept =>
      word.toLowerCase().includes(concept) || concept.includes(word.toLowerCase())
    );
  }

  // Get word type
  private getWordType(doc: any): string {
    if (doc.nouns().length > 0) return 'noun';
    if (doc.verbs().length > 0) return 'verb';
    if (doc.adjectives().length > 0) return 'adjective';
    if (doc.adverbs().length > 0) return 'adverb';
    return 'unknown';
  }

  // Calculate word similarity (simplified)
  private calculateWordSimilarity(
    word1: string,
    word2: string,
    type1: string,
    type2: string
  ): number {
    // In production, use word embeddings (Word2Vec, GloVe, etc.)
    // This is a simplified version

    // Same word
    if (word1.toLowerCase() === word2.toLowerCase()) return 0;

    // Same type gets some similarity
    if (type1 === type2 && type1 !== 'unknown') {
      return 0.5;
    }

    // Check for common substrings
    const commonLength = this.longestCommonSubstring(word1, word2);
    if (commonLength > 3) {
      return Math.min(0.7, commonLength / Math.max(word1.length, word2.length));
    }

    return 0.3;
  }

  // Find longest common substring
  private longestCommonSubstring(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    let longest = 0;

    for (let i = 0; i < s1.length; i++) {
      for (let j = 0; j < s2.length; j++) {
        let k = 0;
        while (i + k < s1.length && j + k < s2.length && s1[i + k] === s2[j + k]) {
          k++;
        }
        longest = Math.max(longest, k);
      }
    }

    return longest;
  }

  // Categorize weirdness level
  private categorizeWeirdness(
    similarity: number,
    weirdnessLevel: number,
    metaphorScore: number
  ): 'safe' | 'wacky' | 'wild' {
    const adjustedSimilarity = similarity + (metaphorScore * weirdnessLevel);

    if (adjustedSimilarity < 0.3 + weirdnessLevel * 0.4) {
      return 'wild';
    } else if (adjustedSimilarity < 0.6 + weirdnessLevel * 0.2) {
      return 'wacky';
    }
    return 'safe';
  }

  // Get score for category based on weirdness preference
  private getCategoryScore(category: 'safe' | 'wacky' | 'wild', weirdness: number): number {
    if (category === 'wild') return weirdness;
    if (category === 'wacky') return 0.5;
    return 1 - weirdness;
  }

  // Track themes
  trackTheme(theme: string): void {
    const count = this.themeMap.get(theme) || 0;
    this.themeMap.set(theme, count + 1);
  }

  // Get dominant themes
  getDominantThemes(topN: number = 5): Array<{ theme: string; count: number }> {
    const themes = Array.from(this.themeMap.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    return themes.slice(0, topN);
  }

  // Reset state
  reset(): void {
    this.entities = [];
    this.threads = [];
    this.themeMap.clear();
  }
}
