import { Suggestion } from './flowCanvasEngine';

export interface SessionAnalytics {
  sessionDuration: number;
  totalWords: number;
  uniqueWords: number;
  rhymeVariety: number;
  avgPhoneticDistance: number;
  callbacksExecuted: number;
  callbackOpportunities: number;
  metaphorDensity: number;
  peakFlowMoments: Array<{
    timestamp: number;
    score: number;
    reason: string;
  }>;
  categoryDistribution: {
    safe: number;
    wacky: number;
    wild: number;
  };
  suggestionAcceptanceRate: number;
  phaseTransitions: Array<{
    phase: string;
    timestamp: number;
  }>;
}

export class AnalyticsEngine {
  private startTime: number = Date.now();
  private wordsUsed: Set<string> = new Set();
  private rhymeFamilies: Set<string> = new Set();
  private phoneticDistances: number[] = [];
  private callbacksExecuted: number = 0;
  private callbackOpportunities: number = 0;
  private metaphorScores: number[] = [];
  private peakMoments: Array<{ timestamp: number; score: number; reason: string }> = [];
  private categoryUsage = { safe: 0, wacky: 0, wild: 0 };
  private suggestionsShown: number = 0;
  private suggestionsAccepted: number = 0;
  private phaseHistory: Array<{ phase: string; timestamp: number }> = [];

  constructor() {}

  // Track word usage
  trackWord(word: string): void {
    this.wordsUsed.add(word.toLowerCase());
  }

  // Track rhyme family
  trackRhymeFamily(family: string): void {
    this.rhymeFamilies.add(family);
  }

  // Track phonetic distance
  trackPhoneticDistance(distance: number): void {
    this.phoneticDistances.push(distance);
  }

  // Track callback
  trackCallback(executed: boolean): void {
    this.callbackOpportunities++;
    if (executed) {
      this.callbacksExecuted++;
    }
  }

  // Track metaphor
  trackMetaphor(score: number): void {
    this.metaphorScores.push(score);
  }

  // Detect peak flow moment
  detectPeakMoment(
    complexity: number,
    novelty: number,
    coherence: number
  ): void {
    const score = (complexity + novelty + coherence) / 3;

    if (score > 0.8) {
      this.peakMoments.push({
        timestamp: Date.now() - this.startTime,
        score,
        reason: this.getReasonForPeak(complexity, novelty, coherence),
      });
    }
  }

  private getReasonForPeak(
    complexity: number,
    novelty: number,
    coherence: number
  ): string {
    if (complexity > 0.9) return 'Complex multi-syllable rhyme sequence';
    if (novelty > 0.9) return 'Highly novel word combination';
    if (coherence > 0.9) return 'Perfect narrative coherence';
    return 'High overall flow quality';
  }

  // Track suggestion interaction
  trackSuggestion(shown: Suggestion, accepted: boolean): void {
    this.suggestionsShown++;
    if (accepted) {
      this.suggestionsAccepted++;
      this.categoryUsage[shown.category]++;
    }
  }

  // Track phase transition
  trackPhaseChange(phase: string): void {
    this.phaseHistory.push({
      phase,
      timestamp: Date.now() - this.startTime,
    });
  }

  // Get analytics summary
  getAnalytics(): SessionAnalytics {
    const duration = (Date.now() - this.startTime) / 1000; // seconds

    return {
      sessionDuration: Math.round(duration),
      totalWords: this.wordsUsed.size,
      uniqueWords: this.wordsUsed.size,
      rhymeVariety: this.rhymeFamilies.size,
      avgPhoneticDistance: this.calculateAverage(this.phoneticDistances),
      callbacksExecuted: this.callbacksExecuted,
      callbackOpportunities: this.callbackOpportunities,
      metaphorDensity: this.metaphorScores.length / (duration / 60), // per minute
      peakFlowMoments: this.peakMoments,
      categoryDistribution: this.categoryUsage,
      suggestionAcceptanceRate:
        this.suggestionsShown > 0
          ? this.suggestionsAccepted / this.suggestionsShown
          : 0,
      phaseTransitions: this.phaseHistory,
    };
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    return sum / numbers.length;
  }

  // Reset for new session
  reset(): void {
    this.startTime = Date.now();
    this.wordsUsed.clear();
    this.rhymeFamilies.clear();
    this.phoneticDistances = [];
    this.callbacksExecuted = 0;
    this.callbackOpportunities = 0;
    this.metaphorScores = [];
    this.peakMoments = [];
    this.categoryUsage = { safe: 0, wacky: 0, wild: 0 };
    this.suggestionsShown = 0;
    this.suggestionsAccepted = 0;
    this.phaseHistory = [];
  }

  // Get real-time stats
  getRealTimeStats() {
    const duration = (Date.now() - this.startTime) / 1000;
    const wordsPerMinute = (this.wordsUsed.size / duration) * 60;

    return {
      wordsPerMinute: Math.round(wordsPerMinute),
      currentStreak: this.calculateCurrentStreak(),
      heatLevel: this.calculateHeatLevel(),
    };
  }

  private calculateCurrentStreak(): number {
    // Simple streak calculation based on recent activity
    return Math.min(10, this.wordsUsed.size);
  }

  private calculateHeatLevel(): number {
    // Heat level based on recent metaphor scores and complexity
    if (this.metaphorScores.length === 0) return 0;

    const recentScores = this.metaphorScores.slice(-10);
    const avgRecent = this.calculateAverage(recentScores);

    return Math.min(1.0, avgRecent * 1.5);
  }
}
