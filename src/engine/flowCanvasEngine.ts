import { RhymeEngine, RhymeMatch } from './rhymeEngine';
import { SemanticEngine, SemanticMatch, StoryThread } from './semanticEngine';
import { CallbackEngine, PerformancePhase, CallbackOpportunity } from './callbackEngine';
import { AudioEngine } from './audioEngine';
import { SpeechEngine, TranscriptSegment } from './speechEngine';
import { cmudict } from './cmudict';

export interface Suggestion {
  word: string;
  type: 'rhyme' | 'semantic' | 'callback' | 'compound';
  category: 'safe' | 'wacky' | 'wild';
  score: number;
  isPinned: boolean;
  metadata: {
    rhymeType?: string;
    metaphorScore?: number;
    callbackTimestamp?: number;
    callbackContext?: string;
  };
}

export interface SessionState {
  id: string;
  startTime: number;
  transcript: string[];
  usedWords: string[];
  pinnedSuggestions: Suggestion[];
  seedText: string;
  weirdnessLevel: number;
  faderate: number;
  density: number;
  currentPhase: string;
  storyThreads: StoryThread[];
  recordingBlob?: Blob;
}

export type SuggestionCallback = (suggestions: Suggestion[]) => void;
export type PhaseCallback = (phase: PerformancePhase) => void;
export type TranscriptCallback = (text: string, words: string[]) => void;

export class FlowCanvasEngine {
  private rhymeEngine: RhymeEngine;
  private semanticEngine: SemanticEngine;
  private callbackEngine: CallbackEngine;
  private audioEngine: AudioEngine;
  private speechEngine: SpeechEngine;

  private suggestions: Map<string, Suggestion> = new Map();
  private pinnedSuggestions: Set<string> = new Set();

  private weirdnessLevel: number = 0.5;
  private fadeRate: number = 5000; // ms until unpinned suggestions fade
  private density: number = 0.7; // 0-1, controls how many suggestions to show

  private sessionId: string = '';
  private sessionStartTime: number = 0;
  private fullTranscript: string[] = [];
  private lastWords: string[] = [];

  private onSuggestionsUpdate: SuggestionCallback | null = null;
  private onPhaseChange: PhaseCallback | null = null;
  private onTranscriptUpdate: TranscriptCallback | null = null;

  private autoSaveInterval: number | null = null;

  constructor() {
    this.rhymeEngine = new RhymeEngine();
    this.semanticEngine = new SemanticEngine();
    this.callbackEngine = new CallbackEngine();
    this.audioEngine = new AudioEngine();
    this.speechEngine = new SpeechEngine();
  }

  // Initialize the system
  async initialize(): Promise<boolean> {
    // Initialize audio
    const audioSuccess = await this.audioEngine.initialize({
      sampleRate: 44100,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });

    if (!audioSuccess) {
      console.error('Failed to initialize audio');
      return false;
    }

    // Start new session
    this.startNewSession();

    // Setup auto-save
    this.setupAutoSave();

    return true;
  }

  // Start new session
  startNewSession(): void {
    this.sessionId = `session-${Date.now()}`;
    this.sessionStartTime = Date.now();
    this.fullTranscript = [];
    this.lastWords = [];
    this.suggestions.clear();
    this.pinnedSuggestions.clear();

    this.rhymeEngine.resetUsage();
    this.semanticEngine.reset();
    this.callbackEngine.reset();

    console.log('New session started:', this.sessionId);
  }

  // Start listening and transcription
  startListening(): boolean {
    if (!this.speechEngine.isSupported()) {
      console.error('Speech recognition not supported');
      return false;
    }

    const success = this.speechEngine.start((segment: TranscriptSegment) => {
      this.handleTranscript(segment);
    });

    if (success) {
      this.audioEngine.startRecording();
    }

    return success;
  }

  // Stop listening
  stopListening(): void {
    this.speechEngine.stop();
  }

  // Handle transcript from speech recognition
  private handleTranscript(segment: TranscriptSegment): void {
    if (!segment.isFinal) {
      // Process interim results for immediate feedback
      this.processWords(segment.words);
      return;
    }

    // Final transcript - add to history
    this.fullTranscript.push(segment.text);
    this.lastWords = [...this.lastWords, ...segment.words].slice(-20);

    // Mark words as used
    segment.words.forEach(word => this.rhymeEngine.markUsed(word));

    // Extract entities and update story threads
    this.semanticEngine.extractEntities(segment.text, segment.timestamp);
    this.semanticEngine.updateStoryThreads(segment.text, segment.timestamp);

    // Add to callback history
    this.callbackEngine.addToHistory(
      segment.text,
      segment.words,
      this.semanticEngine.extractEntities(segment.text, segment.timestamp)
        .map(e => e.text)
    );

    // Process words to generate suggestions
    this.processWords(segment.words);

    // Notify listeners
    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate(segment.text, segment.words);
    }

    // Check phase changes
    const phase = this.callbackEngine.getCurrentPhase();
    if (this.onPhaseChange) {
      this.onPhaseChange(phase);
    }
  }

  // Process words to generate suggestions
  private processWords(words: string[]): void {
    if (words.length === 0) return;

    // Get the last word for rhyme suggestions
    const lastWord = words[words.length - 1];

    // Clear non-pinned suggestions
    const newSuggestions = new Map<string, Suggestion>();

    // Keep pinned suggestions
    this.suggestions.forEach((suggestion, word) => {
      if (suggestion.isPinned) {
        newSuggestions.set(word, suggestion);
      }
    });

    // Generate rhyme suggestions
    const rhymes = this.rhymeEngine.findRhymes(lastWord, {
      maxResults: 30,
      includeUsed: false,
      minScore: 0.4,
    });

    rhymes.forEach(rhyme => {
      if (!newSuggestions.has(rhyme.word)) {
        newSuggestions.set(rhyme.word, {
          word: rhyme.word,
          type: 'rhyme',
          category: this.categorizeRhyme(rhyme),
          score: rhyme.score,
          isPinned: false,
          metadata: {
            rhymeType: rhyme.type,
          },
        });
      }
    });

    // Generate semantic suggestions from Weird Seed
    const semanticMatches = this.semanticEngine.findSemanticMatches(
      lastWord,
      this.weirdnessLevel
    );

    semanticMatches.forEach(match => {
      if (!newSuggestions.has(match.word)) {
        newSuggestions.set(match.word, {
          word: match.word,
          type: 'semantic',
          category: match.category,
          score: match.similarity,
          isPinned: false,
          metadata: {
            metaphorScore: match.metaphorScore,
          },
        });
      }
    });

    // Generate callback suggestions (if in appropriate phase)
    const phonemes = cmudict.getPhonemes(lastWord);
    if (phonemes.length > 0) {
      const callbacks = this.callbackEngine.findCallbackOpportunities(
        lastWord,
        phonemes[0]
      );

      callbacks.forEach(callback => {
        if (!newSuggestions.has(callback.word)) {
          newSuggestions.set(callback.word, {
            word: callback.word,
            type: 'callback',
            category: 'wacky',
            score: (callback.rhymeScore + callback.semanticScore) / 2,
            isPinned: false,
            metadata: {
              callbackTimestamp: callback.originalTimestamp,
              callbackContext: callback.originalContext,
            },
          });
        }
      });
    }

    // Generate compound suggestions
    if (words.length >= 2) {
      const compounds = this.semanticEngine.generateCompounds(words);
      compounds.slice(0, 10).forEach(compound => {
        if (!newSuggestions.has(compound)) {
          newSuggestions.set(compound, {
            word: compound,
            type: 'compound',
            category: 'wild',
            score: 0.6,
            isPinned: false,
            metadata: {},
          });
        }
      });
    }

    // Apply density filter - keep only top N% of suggestions
    const sortedSuggestions = Array.from(newSuggestions.values())
      .sort((a, b) => b.score - a.score);

    const maxSuggestions = Math.max(10, Math.floor(sortedSuggestions.length * this.density));
    const filteredSuggestions = sortedSuggestions.slice(0, maxSuggestions);

    this.suggestions = new Map(
      filteredSuggestions.map(s => [s.word, s])
    );

    // Notify listeners
    if (this.onSuggestionsUpdate) {
      this.onSuggestionsUpdate(Array.from(this.suggestions.values()));
    }
  }

  // Categorize rhyme based on type and novelty
  private categorizeRhyme(rhyme: RhymeMatch): 'safe' | 'wacky' | 'wild' {
    if (rhyme.type === 'perfect' && rhyme.score > 0.9) return 'safe';
    if (rhyme.type === 'near' || rhyme.type === 'assonance') return 'wacky';
    return 'wild';
  }

  // Pin a suggestion
  pinSuggestion(word: string): void {
    const suggestion = this.suggestions.get(word);
    if (suggestion) {
      suggestion.isPinned = true;
      this.pinnedSuggestions.add(word);

      if (this.onSuggestionsUpdate) {
        this.onSuggestionsUpdate(Array.from(this.suggestions.values()));
      }
    }
  }

  // Unpin a suggestion
  unpinSuggestion(word: string): void {
    const suggestion = this.suggestions.get(word);
    if (suggestion) {
      suggestion.isPinned = false;
      this.pinnedSuggestions.delete(word);

      if (this.onSuggestionsUpdate) {
        this.onSuggestionsUpdate(Array.from(this.suggestions.values()));
      }
    }
  }

  // Clear all pinned suggestions
  clearPinned(): void {
    this.suggestions.forEach(suggestion => {
      suggestion.isPinned = false;
    });
    this.pinnedSuggestions.clear();

    if (this.onSuggestionsUpdate) {
      this.onSuggestionsUpdate(Array.from(this.suggestions.values()));
    }
  }

  // Set weird seed text
  setSeedText(text: string): void {
    this.semanticEngine.setSeedText(text);
    // Regenerate suggestions
    if (this.lastWords.length > 0) {
      this.processWords(this.lastWords);
    }
  }

  // Set weirdness level
  setWeirdnessLevel(level: number): void {
    this.weirdnessLevel = Math.max(0, Math.min(1, level));
    if (this.lastWords.length > 0) {
      this.processWords(this.lastWords);
    }
  }

  // Set density
  setDensity(density: number): void {
    this.density = Math.max(0, Math.min(1, density));
    if (this.lastWords.length > 0) {
      this.processWords(this.lastWords);
    }
  }

  // Set fade rate
  setFadeRate(ms: number): void {
    this.fadeRate = Math.max(1000, ms);
  }

  // Set callbacks
  onSuggestions(callback: SuggestionCallback): void {
    this.onSuggestionsUpdate = callback;
  }

  onPhase(callback: PhaseCallback): void {
    this.onPhaseChange = callback;
  }

  onTranscript(callback: TranscriptCallback): void {
    this.onTranscriptUpdate = callback;
  }

  // Get session state
  getSessionState(): SessionState {
    return {
      id: this.sessionId,
      startTime: this.sessionStartTime,
      transcript: this.fullTranscript,
      usedWords: Array.from(this.rhymeEngine['usedWords'] || []),
      pinnedSuggestions: Array.from(this.suggestions.values()).filter(s => s.isPinned),
      seedText: this.semanticEngine['seedText'] || '',
      weirdnessLevel: this.weirdnessLevel,
      fadeRate: this.fadeRate,
      density: this.density,
      currentPhase: this.callbackEngine.getCurrentPhase().phase,
      storyThreads: this.semanticEngine['threads'] || [],
    };
  }

  // Load session state
  loadSessionState(state: SessionState): void {
    this.sessionId = state.id;
    this.sessionStartTime = state.startTime;
    this.fullTranscript = state.transcript;
    this.weirdnessLevel = state.weirdnessLevel;
    this.fadeRate = state.fadeRate;
    this.density = state.density;

    // Restore used words
    state.usedWords.forEach(word => this.rhymeEngine.markUsed(word));

    // Restore seed text
    if (state.seedText) {
      this.semanticEngine.setSeedText(state.seedText);
    }

    // Restore pinned suggestions
    state.pinnedSuggestions.forEach(suggestion => {
      this.suggestions.set(suggestion.word, suggestion);
      this.pinnedSuggestions.add(suggestion.word);
    });

    console.log('Session state loaded:', state.id);
  }

  // Setup auto-save
  private setupAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = window.setInterval(() => {
      this.saveSession();
    }, 30000); // Every 30 seconds
  }

  // Save session
  async saveSession(): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const state = this.getSessionState();
      const result = await (window as any).electron.saveSession(JSON.stringify(state));
      if (result.success) {
        console.log('Session auto-saved:', result.filepath);
      }
    }
  }

  // Stop recording and save
  async stopAndSaveRecording(): Promise<Blob | null> {
    if (!this.audioEngine.isCurrentlyRecording()) {
      return null;
    }

    try {
      const blob = await this.audioEngine.stopRecording();

      if (typeof window !== 'undefined' && (window as any).electron) {
        const arrayBuffer = await blob.arrayBuffer();
        await (window as any).electron.saveRecording(arrayBuffer, this.sessionId);
      }

      return blob;
    } catch (error) {
      console.error('Error saving recording:', error);
      return null;
    }
  }

  // Get current suggestions
  getSuggestions(): Suggestion[] {
    return Array.from(this.suggestions.values());
  }

  // Get current phase
  getCurrentPhase(): PerformancePhase {
    return this.callbackEngine.getCurrentPhase();
  }

  // Get story threads
  getStoryThreads(): StoryThread[] {
    return this.semanticEngine.getOpenThreads();
  }

  // Cleanup
  cleanup(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.speechEngine.stop();
    this.audioEngine.cleanup();
  }
}
