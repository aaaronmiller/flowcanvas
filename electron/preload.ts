import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  saveSession: (sessionData: string) => ipcRenderer.invoke('save-session', sessionData),
  loadSession: (filepath: string) => ipcRenderer.invoke('load-session', filepath),
  listSessions: () => ipcRenderer.invoke('list-sessions'),
  exportSession: (sessionData: string, filepath: string) =>
    ipcRenderer.invoke('export-session', sessionData, filepath),
  saveRecording: (audioBlob: ArrayBuffer, sessionId: string) =>
    ipcRenderer.invoke('save-recording', Buffer.from(audioBlob), sessionId),
});

export {};
