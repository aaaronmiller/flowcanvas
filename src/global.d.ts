export {};

declare global {
  interface Window {
    electron?: {
      saveSession: (sessionData: string) => Promise<{ success: boolean; filepath?: string; error?: string }>;
      loadSession: (filepath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      listSessions: () => Promise<{ success: boolean; sessions?: string[]; error?: string }>;
      exportSession: (sessionData: string, filepath: string) => Promise<{ success: boolean; error?: string }>;
      saveRecording: (audioBlob: ArrayBuffer, sessionId: string) => Promise<{ success: boolean; filepath?: string; error?: string }>;
    };
  }
}
