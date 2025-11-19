import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { FlowCanvasEngine, Suggestion, SessionState } from './engine/flowCanvasEngine';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TileCanvas } from './components/TileCanvas';
import { RhymeGraph } from './components/RhymeGraph';
import { TranscriptView } from './components/TranscriptView';
import { ControlPanel } from './components/ControlPanel';
import { PhaseIndicator } from './components/PhaseIndicator';
import { WeirdSeedPanel } from './components/WeirdSeedPanel';
import { ThreadsPanel } from './components/ThreadsPanel';
import { AudioVisualizer } from './components/AudioVisualizer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TimelineVisualization } from './components/TimelineVisualization';
import { notify } from './utils/notifications';
import './styles/App.css';

export function App() {
  const engineRef = useRef<FlowCanvasEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('opening');
  const [weirdnessLevel, setWeirdnessLevel] = useState(0.5);
  const [density, setDensity] = useState(0.7);
  const [activeSidePanel, setActiveSidePanel] = useState<'graph' | 'threads' | 'analytics' | 'timeline'>('graph');

  // Initialize engine
  useEffect(() => {
    const engine = new FlowCanvasEngine();

    engine.initialize().then(success => {
      if (success) {
        engineRef.current = engine;
        setIsInitialized(true);

        // Setup callbacks
        engine.onSuggestions(setSuggestions);
        engine.onPhase(phase => setCurrentPhase(phase.phase));
        engine.onTranscript((text, _words) => {
          setTranscript(prev => [...prev, text]);
        });

        notify.success('FlowCanvas initialized successfully! 🎤');

        // Check for MIDI
        if (engine.getMIDIEngine().isAvailable()) {
          notify.info('MIDI controller connected');
        }
      } else {
        notify.error('Failed to initialize FlowCanvas');
      }
    }).catch(error => {
      console.error('Initialization error:', error);
      notify.error('Failed to initialize: ' + error.message);
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          toggleListening();
          break;
        case 'p':
          e.preventDefault();
          // Pin first unpinned suggestion
          const unpinned = suggestions.find(s => !s.isPinned);
          if (unpinned) {
            handlePinSuggestion(unpinned.word);
          }
          break;
        case 'c':
          e.preventDefault();
          handleClearPinned();
          break;
        case 'n':
          e.preventDefault();
          startNewSession();
          break;
        case 's':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleSaveSession();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, suggestions]);

  // Handle start/stop listening
  const toggleListening = () => {
    if (!engineRef.current) return;

    if (isListening) {
      engineRef.current.stopListening();
      setIsListening(false);
    } else {
      const success = engineRef.current.startListening();
      if (success) {
        setIsListening(true);
      }
    }
  };

  // Handle new session
  const startNewSession = async () => {
    if (!engineRef.current) return;

    if (confirm('Start a new session? Current session will be saved.')) {
      await engineRef.current.saveSession();
      engineRef.current.startNewSession();
      setTranscript([]);
      setSuggestions([]);
      setCurrentPhase('opening');
      notify.success('New session started! 📝');
    }
  };

  // Handle pin suggestion
  const handlePinSuggestion = (word: string) => {
    if (!engineRef.current) return;
    engineRef.current.pinSuggestion(word);
  };

  // Handle unpin suggestion
  const handleUnpinSuggestion = (word: string) => {
    if (!engineRef.current) return;
    engineRef.current.unpinSuggestion(word);
  };

  // Handle clear pinned
  const handleClearPinned = () => {
    if (!engineRef.current) return;
    engineRef.current.clearPinned();
  };

  // Handle seed text change
  const handleSeedTextChange = (text: string) => {
    if (!engineRef.current) return;
    engineRef.current.setSeedText(text);
  };

  // Handle weirdness change
  const handleWeirdnessChange = (level: number) => {
    if (!engineRef.current) return;
    setWeirdnessLevel(level);
    engineRef.current.setWeirdnessLevel(level);
  };

  // Handle density change
  const handleDensityChange = (level: number) => {
    if (!engineRef.current) return;
    setDensity(level);
    engineRef.current.setDensity(level);
  };

  // Save session manually
  const handleSaveSession = async () => {
    if (!engineRef.current) return;

    const loadingToast = notify.loading('Saving session...');
    try {
      await engineRef.current.saveSession();
      notify.dismiss(loadingToast);
      notify.success('Session saved successfully! 💾');
    } catch (error) {
      notify.dismiss(loadingToast);
      notify.error('Failed to save session');
    }
  };

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Initializing FlowCanvas...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <h1>FlowCanvas</h1>
            <span className="subtitle">Elite Performer Edition</span>
          </div>
          <div className="header-right">
            <PhaseIndicator phase={currentPhase} />
          </div>
        </header>

        <div className="app-content">
          <div className="main-panel">
            <ControlPanel
              isListening={isListening}
              onToggleListening={toggleListening}
              onNewSession={startNewSession}
              onSave={handleSaveSession}
              onClearPinned={handleClearPinned}
              weirdnessLevel={weirdnessLevel}
              onWeirdnessChange={handleWeirdnessChange}
              density={density}
              onDensityChange={handleDensityChange}
            />

            <AudioVisualizer
              audioEngine={engineRef.current?.getAudioEngine() || null}
              isListening={isListening}
            />

            <TileCanvas
              suggestions={suggestions}
              onPin={handlePinSuggestion}
              onUnpin={handleUnpinSuggestion}
            />

            <TranscriptView transcript={transcript} />
          </div>

          <div className="side-panel">
            <div className="panel-tabs">
              <button
                className={activeSidePanel === 'graph' ? 'active' : ''}
                onClick={() => setActiveSidePanel('graph')}
              >
                Rhyme Graph
              </button>
              <button
                className={activeSidePanel === 'threads' ? 'active' : ''}
                onClick={() => setActiveSidePanel('threads')}
              >
                Threads
              </button>
              <button
                className={activeSidePanel === 'analytics' ? 'active' : ''}
                onClick={() => setActiveSidePanel('analytics')}
              >
                Analytics
              </button>
              <button
                className={activeSidePanel === 'timeline' ? 'active' : ''}
                onClick={() => setActiveSidePanel('timeline')}
              >
                Timeline
              </button>
            </div>

            {activeSidePanel === 'graph' && <RhymeGraph suggestions={suggestions} />}
            {activeSidePanel === 'threads' && <ThreadsPanel engine={engineRef.current} />}
            {activeSidePanel === 'analytics' && <AnalyticsDashboard engine={engineRef.current} />}
            {activeSidePanel === 'timeline' && (
              <TimelineVisualization
                history={engineRef.current?.getHistory() || []}
                currentTime={Date.now()}
              />
            )}

            <WeirdSeedPanel onSeedChange={handleSeedTextChange} />
          </div>
        </div>

        <footer className="app-footer">
          <div className="footer-stats">
            <span>Suggestions: {suggestions.length}</span>
            <span>|</span>
            <span>Pinned: {suggestions.filter(s => s.isPinned).length}</span>
            <span>|</span>
            <span>Transcript: {transcript.length} segments</span>
          </div>
          <div className="footer-shortcuts">
            <kbd>Space</kbd> Start/Stop
            <kbd>P</kbd> Pin
            <kbd>C</kbd> Clear
            <kbd>N</kbd> New Session
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
