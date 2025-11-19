export interface CallbackOpportunity {
  word: string;
  originalTimestamp: number;
  originalContext: string;
  rhymeScore: number;
  semanticScore: number;
  isCallbackTo(currentTime: number): boolean {
    return currentTime - this.originalTimestamp > 60000; // More than 1 minute
  }
}

export interface PerformancePhase {
  phase: 'opening' | 'development' | 'resolution';
  startTime: number;
  confidence: number;
}

export interface HistoricalMoment {
  timestamp: number;
  text: string;
  words: string[];
  entities: string[];
  theme?: string;
  significance: number;
}

export class CallbackEngine {
  private history: HistoricalMoment[] = [];
  private sessionStartTime: number = Date.now();
  private currentPhase: PerformancePhase = {
    phase: 'opening',
    startTime: Date.now(),
    confidence: 1.0,
  };

  constructor() {}

  // Add to history
  addToHistory(text: string, words: string[], entities: string[] = []): void {
    const moment: HistoricalMoment = {
      timestamp: Date.now(),
      text,
      words,
      entities,
      significance: this.calculateSignificance(text, entities),
    };

    this.history.push(moment);

    // Update phase detection
    this.updatePhaseDetection();
  }

  // Find callback opportunities
  findCallbackOpportunities(
    currentWord: string,
    currentPhonemes: string[]
  ): CallbackOpportunity[] {
    const currentTime = Date.now();
    const sessionDuration = currentTime - this.sessionStartTime;

    // Only suggest callbacks in appropriate phase
    if (this.currentPhase.phase === 'opening') {
      return [];
    }

    const opportunities: CallbackOpportunity[] = [];

    // Look for significant moments in history
    const significantMoments = this.history
      .filter(m => m.significance > 0.6)
      .filter(m => currentTime - m.timestamp > 60000); // At least 1 minute ago

    for (const moment of significantMoments) {
      for (const word of moment.words) {
        // Check if this word could be a callback
        const rhymeScore = this.calculateRhymeCompatibility(word, currentWord);
        const semanticScore = this.calculateSemanticRelevance(moment, currentWord);

        if (rhymeScore > 0.7 || semanticScore > 0.6) {
          opportunities.push({
            word,
            originalTimestamp: moment.timestamp,
            originalContext: moment.text,
            rhymeScore,
            semanticScore,
            isCallbackTo: (currentTime: number) =>
              currentTime - moment.timestamp > 60000,
          });
        }
      }
    }

    // Sort by combined score
    opportunities.sort((a, b) => {
      const scoreA = (a.rhymeScore * 0.6) + (a.semanticScore * 0.4);
      const scoreB = (b.rhymeScore * 0.6) + (b.semanticScore * 0.4);
      return scoreB - scoreA;
    });

    return opportunities.slice(0, 10);
  }

  // Update phase detection
  private updatePhaseDetection(): void {
    const currentTime = Date.now();
    const sessionDuration = (currentTime - this.sessionStartTime) / 1000; // seconds
    const recentHistory = this.history.slice(-20);

    // Time-based phase detection
    if (sessionDuration < 300) {
      // First 5 minutes: opening
      this.currentPhase = {
        phase: 'opening',
        startTime: this.sessionStartTime,
        confidence: 1.0,
      };
    } else if (sessionDuration < 1500) {
      // 5-25 minutes: development
      this.currentPhase = {
        phase: 'development',
        startTime: this.sessionStartTime + 300000,
        confidence: 0.9,
      };
    } else {
      // 25+ minutes: resolution
      this.currentPhase = {
        phase: 'resolution',
        startTime: this.sessionStartTime + 1500000,
        confidence: 0.8,
      };
    }

    // Adjust based on content analysis
    if (recentHistory.length >= 10) {
      const newEntityRate = this.calculateNewEntityRate(recentHistory);

      if (newEntityRate < 0.2 && sessionDuration > 300) {
        // Low new entity introduction suggests resolution phase
        this.currentPhase.phase = 'resolution';
        this.currentPhase.confidence = Math.min(1.0, this.currentPhase.confidence + 0.2);
      }
    }
  }

  // Calculate rate of new entity introduction
  private calculateNewEntityRate(moments: HistoricalMoment[]): number {
    const allEntities = new Set<string>();
    const recentEntities = new Set<string>();

    this.history.forEach(m => m.entities.forEach(e => allEntities.add(e)));
    moments.forEach(m => m.entities.forEach(e => recentEntities.add(e)));

    let newCount = 0;
    recentEntities.forEach(e => {
      if (!allEntities.has(e)) newCount++;
    });

    return moments.length > 0 ? newCount / moments.length : 0;
  }

  // Get current phase
  getCurrentPhase(): PerformancePhase {
    return this.currentPhase;
  }

  // Get session duration
  getSessionDuration(): number {
    return (Date.now() - this.sessionStartTime) / 1000;
  }

  // Get open threads
  getOpenThreads(): Array<{
    entities: string[];
    firstMention: number;
    lastMention: number;
    mentions: number;
  }> {
    const entityTracker = new Map<
      string,
      { first: number; last: number; count: number }
    >();

    this.history.forEach(moment => {
      moment.entities.forEach(entity => {
        const existing = entityTracker.get(entity);
        if (existing) {
          existing.last = moment.timestamp;
          existing.count++;
        } else {
          entityTracker.set(entity, {
            first: moment.timestamp,
            last: moment.timestamp,
            count: 1,
          });
        }
      });
    });

    const currentTime = Date.now();
    const openThreads: Array<{
      entities: string[];
      firstMention: number;
      lastMention: number;
      mentions: number;
    }> = [];

    // An entity is an "open thread" if:
    // 1. Mentioned in opening phase
    // 2. Not mentioned recently (last 2 minutes)
    // 3. Mentioned at least twice
    entityTracker.forEach((data, entity) => {
      const timeSinceFirst = currentTime - data.first;
      const timeSinceLast = currentTime - data.last;

      if (
        timeSinceFirst > 300000 && // Mentioned more than 5 min ago
        timeSinceLast > 120000 &&  // Not mentioned in last 2 min
        data.count >= 2             // Mentioned at least twice
      ) {
        openThreads.push({
          entities: [entity],
          firstMention: data.first,
          lastMention: data.last,
          mentions: data.count,
        });
      }
    });

    return openThreads;
  }

  // Calculate significance of a moment
  private calculateSignificance(text: string, entities: string[]): number {
    let score = 0.5;

    // More entities = more significant
    score += Math.min(0.3, entities.length * 0.1);

    // Longer text = more significant
    score += Math.min(0.2, text.split(' ').length * 0.02);

    return Math.min(1.0, score);
  }

  // Calculate rhyme compatibility (simplified)
  private calculateRhymeCompatibility(word1: string, word2: string): number {
    // In production, use actual phoneme matching from rhymeEngine
    // This is a simplified version
    const w1 = word1.toLowerCase();
    const w2 = word2.toLowerCase();

    if (w1 === w2) return 1.0;

    // Check if endings match (simple rhyme heuristic)
    const len1 = w1.length;
    const len2 = w2.length;

    for (let i = 2; i <= Math.min(len1, len2, 4); i++) {
      const end1 = w1.slice(-i);
      const end2 = w2.slice(-i);
      if (end1 === end2) {
        return 0.7 + (i * 0.1);
      }
    }

    return 0.3;
  }

  // Calculate semantic relevance (simplified)
  private calculateSemanticRelevance(moment: HistoricalMoment, currentWord: string): number {
    // Check if current word relates to moment's entities or words
    const currentLower = currentWord.toLowerCase();

    // Direct match with entities
    if (moment.entities.some(e => e.toLowerCase() === currentLower)) {
      return 1.0;
    }

    // Partial match with entities
    if (moment.entities.some(e =>
      e.toLowerCase().includes(currentLower) ||
      currentLower.includes(e.toLowerCase())
    )) {
      return 0.7;
    }

    // Match with words
    if (moment.words.some(w => w.toLowerCase() === currentLower)) {
      return 0.5;
    }

    return 0.2;
  }

  // Reset for new session
  reset(): void {
    this.history = [];
    this.sessionStartTime = Date.now();
    this.currentPhase = {
      phase: 'opening',
      startTime: Date.now(),
      confidence: 1.0,
    };
  }

  // Get history
  getHistory(): HistoricalMoment[] {
    return this.history;
  }

  // Get significant moments for highlight detection
  getSignificantMoments(threshold: number = 0.8): HistoricalMoment[] {
    return this.history.filter(m => m.significance >= threshold);
  }
}
