import React, { useEffect, useState } from 'react';
import { Suggestion } from '../engine/flowCanvasEngine';
import '../styles/TileCanvas.css';

interface TileCanvasProps {
  suggestions: Suggestion[];
  onPin: (word: string) => void;
  onUnpin: (word: string) => void;
}

export function TileCanvas({ suggestions, onPin, onUnpin }: TileCanvasProps) {
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  // Group suggestions by category
  const groupedSuggestions = {
    safe: suggestions.filter(s => s.category === 'safe'),
    wacky: suggestions.filter(s => s.category === 'wacky'),
    wild: suggestions.filter(s => s.category === 'wild'),
  };

  const handleTileClick = (suggestion: Suggestion) => {
    if (suggestion.isPinned) {
      onUnpin(suggestion.word);
    } else {
      onPin(suggestion.word);
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'safe':
        return '#4ade80'; // green
      case 'wacky':
        return '#fbbf24'; // yellow
      case 'wild':
        return '#f87171'; // red
      default:
        return '#94a3b8'; // gray
    }
  };

  const getTileIcon = (type: string): string => {
    switch (type) {
      case 'rhyme':
        return '🎵';
      case 'semantic':
        return '🌀';
      case 'callback':
        return '🔁';
      case 'compound':
        return '⚡';
      default:
        return '💬';
    }
  };

  return (
    <div className="tile-canvas">
      <div className="canvas-header">
        <h2>Suggestions</h2>
        <div className="legend">
          <span className="legend-item">
            <span className="dot safe"></span> Safe
          </span>
          <span className="legend-item">
            <span className="dot wacky"></span> Wacky
          </span>
          <span className="legend-item">
            <span className="dot wild"></span> Wild
          </span>
        </div>
      </div>

      <div className="tiles-container">
        {Object.entries(groupedSuggestions).map(([category, tiles]) => (
          <div key={category} className={`tile-group ${category}`}>
            {tiles.map(suggestion => (
              <div
                key={suggestion.word}
                className={`tile ${suggestion.isPinned ? 'pinned' : ''} ${category}`}
                onClick={() => handleTileClick(suggestion)}
                onMouseEnter={() => setHoveredTile(suggestion.word)}
                onMouseLeave={() => setHoveredTile(null)}
                style={{
                  borderColor: getCategoryColor(suggestion.category),
                }}
              >
                <div className="tile-icon">{getTileIcon(suggestion.type)}</div>
                <div className="tile-word">{suggestion.word}</div>
                <div className="tile-score">{Math.round(suggestion.score * 100)}%</div>

                {suggestion.isPinned && (
                  <div className="pin-indicator">📌</div>
                )}

                {hoveredTile === suggestion.word && (
                  <div className="tile-tooltip">
                    <div>Type: {suggestion.type}</div>
                    <div>Category: {suggestion.category}</div>
                    {suggestion.metadata.rhymeType && (
                      <div>Rhyme: {suggestion.metadata.rhymeType}</div>
                    )}
                    {suggestion.metadata.metaphorScore && (
                      <div>
                        Metaphor: {Math.round(suggestion.metadata.metaphorScore * 100)}%
                      </div>
                    )}
                    {suggestion.metadata.callbackContext && (
                      <div className="callback-context">
                        {suggestion.metadata.callbackContext}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {suggestions.length === 0 && (
        <div className="empty-state">
          <p>Start speaking to see suggestions appear...</p>
        </div>
      )}
    </div>
  );
}
