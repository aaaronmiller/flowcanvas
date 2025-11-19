import { HistoricalMoment } from './callbackEngine';

export interface Highlight {
  id: string;
  startTime: number;
  endTime: number;
  score: number;
  reasons: string[];
  audioSegment?: Blob;
  transcript: string;
}

export class HighlightEngine {
  private sessionHistory: HistoricalMoment[] = [];
  private highlights: Highlight[] = [];

  constructor() {}

  // Analyze session and detect highlights
  analyzeSession(history: HistoricalMoment[]): Highlight[] {
    this.sessionHistory = history;
    this.highlights = [];

    // Detect different types of highlights
    this.detectMetaphorPeaks();
    this.detectComplexRhymeSequences();
    this.detectThreadIntersections();
    this.detectEmotionalPeaks();
    this.detectCallbackExecutions();

    // Sort by score
    this.highlights.sort((a, b) => b.score - a.score);

    return this.highlights;
  }

  // Detect metaphor-rich moments
  private detectMetaphorPeaks(): void {
    for (let i = 0; i < this.sessionHistory.length; i++) {
      const moment = this.sessionHistory.length;
      const windowSize = 3;

      // Look at window of moments
      const start = Math.max(0, i - windowSize);
      const end = Math.min(this.sessionHistory.length, i + windowSize + 1);
      const window = this.sessionHistory.slice(start, end);

      // Calculate average significance
      const avgSignificance = window.reduce((sum, m) => sum + m.significance, 0) / window.length;

      if (avgSignificance > 0.75) {
        this.addHighlight({
          startTime: window[0].timestamp,
          endTime: window[window.length - 1].timestamp,
          score: avgSignificance,
          reasons: ['High metaphor density'],
          transcript: window.map(m => m.text).join(' '),
        });
      }
    }
  }

  // Detect complex rhyme sequences
  private detectComplexRhymeSequences(): void {
    // Look for consecutive moments with high word density
    let sequenceStart = -1;
    let sequenceScore = 0;

    for (let i = 0; i < this.sessionHistory.length; i++) {
      const moment = this.sessionHistory[i];
      const wordCount = moment.words.length;

      if (wordCount > 8) {
        if (sequenceStart === -1) {
          sequenceStart = i;
          sequenceScore = moment.significance;
        } else {
          sequenceScore = (sequenceScore + moment.significance) / 2;
        }
      } else {
        if (sequenceStart !== -1 && i - sequenceStart >= 2) {
          // Found a sequence
          const sequence = this.sessionHistory.slice(sequenceStart, i);
          this.addHighlight({
            startTime: sequence[0].timestamp,
            endTime: sequence[sequence.length - 1].timestamp,
            score: sequenceScore,
            reasons: ['Complex multi-bar rhyme sequence'],
            transcript: sequence.map(m => m.text).join(' '),
          });
        }
        sequenceStart = -1;
        sequenceScore = 0;
      }
    }
  }

  // Detect thread intersections
  private detectThreadIntersections(): void {
    const entityCounts = new Map<number, Set<string>>();

    for (let i = 0; i < this.sessionHistory.length; i++) {
      const moment = this.sessionHistory[i];
      if (moment.entities.length > 0) {
        entityCounts.set(i, new Set(moment.entities));
      }
    }

    // Find moments where multiple entities converge
    entityCounts.forEach((entities, index) => {
      if (entities.size >= 2) {
        const moment = this.sessionHistory[index];
        this.addHighlight({
          startTime: moment.timestamp - 5000,
          endTime: moment.timestamp + 5000,
          score: 0.8 + (entities.size * 0.05),
          reasons: [`${entities.size} story threads intersecting`],
          transcript: moment.text,
        });
      }
    });
  }

  // Detect emotional peaks (simplified)
  private detectEmotionalPeaks(): void {
    // Look for moments with strong emotional indicators
    const emotionalWords = new Set([
      'love', 'hate', 'fear', 'joy', 'pain', 'hope', 'dream',
      'fight', 'die', 'live', 'heart', 'soul', 'mind', 'cry', 'laugh'
    ]);

    for (const moment of this.sessionHistory) {
      const emotionalCount = moment.words.filter(w =>
        emotionalWords.has(w.toLowerCase())
      ).length;

      if (emotionalCount >= 2) {
        this.addHighlight({
          startTime: moment.timestamp - 3000,
          endTime: moment.timestamp + 3000,
          score: 0.75 + (emotionalCount * 0.05),
          reasons: ['Emotional intensity peak'],
          transcript: moment.text,
        });
      }
    }
  }

  // Detect callback executions
  private detectCallbackExecutions(): void {
    // Look for moments that reference earlier content
    for (let i = 10; i < this.sessionHistory.length; i++) {
      const current = this.sessionHistory[i];
      const earlier = this.sessionHistory.slice(0, i - 10);

      // Check for word repetitions that might be callbacks
      for (const word of current.words) {
        const earlierMentions = earlier.filter(m =>
          m.words.includes(word) && m.entities.includes(word)
        );

        if (earlierMentions.length > 0) {
          const timeGap = current.timestamp - earlierMentions[0].timestamp;
          if (timeGap > 60000) { // More than 1 minute ago
            this.addHighlight({
              startTime: current.timestamp - 5000,
              endTime: current.timestamp + 5000,
              score: 0.85,
              reasons: ['Callback to earlier moment'],
              transcript: current.text,
            });
            break;
          }
        }
      }
    }
  }

  // Add highlight (merge overlapping ones)
  private addHighlight(highlight: Omit<Highlight, 'id'>): void {
    // Check for overlaps
    for (const existing of this.highlights) {
      if (this.overlaps(existing, highlight)) {
        // Merge
        existing.startTime = Math.min(existing.startTime, highlight.startTime);
        existing.endTime = Math.max(existing.endTime, highlight.endTime);
        existing.score = Math.max(existing.score, highlight.score);
        existing.reasons = [...new Set([...existing.reasons, ...highlight.reasons])];
        return;
      }
    }

    // Add new highlight
    this.highlights.push({
      id: `highlight-${Date.now()}-${Math.random()}`,
      ...highlight,
    });
  }

  // Check if two highlights overlap
  private overlaps(a: { startTime: number; endTime: number }, b: { startTime: number; endTime: number }): boolean {
    return a.startTime <= b.endTime && b.startTime <= a.endTime;
  }

  // Get top N highlights
  getTopHighlights(n: number = 10): Highlight[] {
    return this.highlights.slice(0, n);
  }

  // Get highlights in time range
  getHighlightsInRange(startTime: number, endTime: number): Highlight[] {
    return this.highlights.filter(h =>
      h.startTime <= endTime && h.endTime >= startTime
    );
  }

  // Generate highlight reel (extract best 15-30 second segments)
  generateHighlightReel(targetDuration: number = 90): Highlight[] {
    const reel: Highlight[] = [];
    let totalDuration = 0;

    for (const highlight of this.highlights) {
      const duration = (highlight.endTime - highlight.startTime) / 1000; // seconds

      // Prefer 15-30 second segments
      if (duration >= 15 && duration <= 30 && totalDuration + duration <= targetDuration) {
        reel.push(highlight);
        totalDuration += duration;
      }

      if (totalDuration >= targetDuration) break;
    }

    return reel;
  }

  // Reset
  reset(): void {
    this.sessionHistory = [];
    this.highlights = [];
  }
}
