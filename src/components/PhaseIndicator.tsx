import React from 'react';
import '../styles/PhaseIndicator.css';

interface PhaseIndicatorProps {
  phase: string;
}

export function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const getPhaseIcon = (phase: string): string => {
    switch (phase) {
      case 'opening':
        return '🌅';
      case 'development':
        return '🚀';
      case 'resolution':
        return '🎯';
      default:
        return '⭐';
    }
  };

  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'opening':
        return '#4ade80';
      case 'development':
        return '#fbbf24';
      case 'resolution':
        return '#f87171';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="phase-indicator">
      <div className="phase-content">
        <span className="phase-icon">{getPhaseIcon(phase)}</span>
        <div className="phase-info">
          <span className="phase-label">Current Phase</span>
          <span
            className="phase-name"
            style={{ color: getPhaseColor(phase) }}
          >
            {phase.charAt(0).toUpperCase() + phase.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
