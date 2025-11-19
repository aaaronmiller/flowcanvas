export interface TranscriptSegment {
  text: string;
  words: string[];
  timestamp: number;
  isFinal: boolean;
}

export type SpeechCallback = (segment: TranscriptSegment) => void;

export class SpeechEngine {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private onTranscript: SpeechCallback | null = null;
  private currentTranscript: string = '';

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      this.recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      // @ts-ignore
      this.recognition = new SpeechRecognition();
    }

    if (this.recognition) {
      this.setupRecognition();
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Process final transcript
      if (finalTranscript) {
        this.currentTranscript += finalTranscript;
        const words = this.extractWords(finalTranscript);

        if (this.onTranscript) {
          this.onTranscript({
            text: finalTranscript.trim(),
            words,
            timestamp: Date.now(),
            isFinal: true,
          });
        }
      }

      // Process interim transcript
      if (interimTranscript && this.onTranscript) {
        const words = this.extractWords(interimTranscript);

        this.onTranscript({
          text: interimTranscript.trim(),
          words,
          timestamp: Date.now(),
          isFinal: false,
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      // Restart on certain errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        if (this.isListening) {
          setTimeout(() => {
            if (this.isListening) {
              this.start();
            }
          }, 1000);
        }
      }
    };

    this.recognition.onend = () => {
      // Automatically restart if still listening
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening) {
            this.start();
          }
        }, 100);
      }
    };
  }

  // Extract words from text
  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // Start listening
  start(callback: SpeechCallback): boolean {
    if (!this.recognition) {
      console.error('Speech recognition not supported');
      return false;
    }

    try {
      this.onTranscript = callback;
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  // Stop listening
  stop(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  // Check if listening
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Get full transcript
  getFullTranscript(): string {
    return this.currentTranscript.trim();
  }

  // Clear transcript
  clearTranscript(): void {
    this.currentTranscript = '';
  }

  // Check if supported
  isSupported(): boolean {
    return this.recognition !== null;
  }
}

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
}
