import React from 'react';
import '../styles/ControlPanel.css';

interface ControlPanelProps {
  isListening: boolean;
  onToggleListening: () => void;
  onNewSession: () => void;
  onSave: () => void;
  onClearPinned: () => void;
  weirdnessLevel: number;
  onWeirdnessChange: (level: number) => void;
  density: number;
  onDensityChange: (level: number) => void;
}

export function ControlPanel({
  isListening,
  onToggleListening,
  onNewSession,
  onSave,
  onClearPinned,
  weirdnessLevel,
  onWeirdnessChange,
  density,
  onDensityChange,
}: ControlPanelProps) {
  return (
    <div className="control-panel">
      <div className="controls-primary">
        <button
          className={`btn-primary ${isListening ? 'listening' : ''}`}
          onClick={onToggleListening}
          title="Toggle listening (Space)"
        >
          {isListening ? (
            <>
              <span className="pulse-dot"></span>
              Stop Listening
            </>
          ) : (
            <>
              🎤 Start Listening
            </>
          )}
        </button>

        <button
          className="btn-secondary"
          onClick={onNewSession}
          title="New session (N)"
        >
          📝 New Session
        </button>

        <button
          className="btn-secondary"
          onClick={onSave}
          title="Save session"
        >
          💾 Save
        </button>

        <button
          className="btn-secondary"
          onClick={onClearPinned}
          title="Clear pinned (C)"
        >
          🧹 Clear Pinned
        </button>
      </div>

      <div className="controls-sliders">
        <div className="slider-group">
          <label>
            Weirdness
            <span className="slider-value">{Math.round(weirdnessLevel * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={weirdnessLevel * 100}
            onChange={(e) => onWeirdnessChange(Number(e.target.value) / 100)}
            className="slider weirdness"
          />
          <div className="slider-labels">
            <span>Safe</span>
            <span>Wild</span>
          </div>
        </div>

        <div className="slider-group">
          <label>
            Density
            <span className="slider-value">{Math.round(density * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={density * 100}
            onChange={(e) => onDensityChange(Number(e.target.value) / 100)}
            className="slider density"
          />
          <div className="slider-labels">
            <span>Minimal</span>
            <span>Maximum</span>
          </div>
        </div>
      </div>
    </div>
  );
}
