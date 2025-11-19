export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private analyser: AnalyserNode | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private isListening: boolean = false;

  constructor() {}

  // Initialize audio capture
  async initialize(config: AudioConfig): Promise<boolean> {
    try {
      this.audioContext = new AudioContext({
        sampleRate: config.sampleRate || 44100,
      });

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: config.channelCount || 1,
          echoCancellation: config.echoCancellation !== false,
          noiseSuppression: config.noiseSuppression !== false,
          autoGainControl: config.autoGainControl !== false,
        },
      });

      // Create analyser for real-time audio visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  // Start recording
  startRecording(): boolean {
    if (!this.mediaStream || this.isRecording) {
      return false;
    }

    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  // Stop recording
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedChunks = [];
        this.isRecording = false;
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Get current audio data for visualization
  getAudioData(): Uint8Array | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    return dataArray;
  }

  // Get frequency data
  getFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    return dataArray;
  }

  // Calculate audio level (for visual feedback)
  getAudioLevel(): number {
    const data = this.getAudioData();
    if (!data) return 0;

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      sum += normalized * normalized;
    }

    const rms = Math.sqrt(sum / data.length);
    return Math.min(1.0, rms * 10);
  }

  // Check if currently recording
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // Check if audio is initialized
  isInitialized(): boolean {
    return this.audioContext !== null && this.mediaStream !== null;
  }

  // Clean up
  cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.isListening = false;
  }
}
