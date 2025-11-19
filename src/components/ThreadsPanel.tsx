import React, { useState, useEffect } from 'react';
import { FlowCanvasEngine } from '../engine/flowCanvasEngine';
import { StoryThread } from '../engine/semanticEngine';
import '../styles/ThreadsPanel.css';

interface ThreadsPanelProps {
  engine: FlowCanvasEngine | null;
}

export function ThreadsPanel({ engine }: ThreadsPanelProps) {
  const [threads, setThreads] = useState<StoryThread[]>([]);

  useEffect(() => {
    if (!engine) return;

    const interval = setInterval(() => {
      const openThreads = engine.getStoryThreads();
      setThreads(openThreads);
    }, 2000);

    return () => clearInterval(interval);
  }, [engine]);

  const formatTimestamp = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return '#4ade80';
      case 'negative':
        return '#f87171';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="threads-panel">
      <h3>Story Threads</h3>
      <p className="threads-description">
        Open narrative threads waiting for resolution
      </p>

      <div className="threads-list">
        {threads.length === 0 ? (
          <div className="no-threads">
            <p>No open threads detected yet</p>
            <small>Threads will appear as you develop narratives</small>
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} className="thread-item">
              <div className="thread-header">
                <span className="thread-theme">{thread.theme}</span>
                <span
                  className="thread-sentiment"
                  style={{ color: getSentimentColor(thread.sentiment) }}
                >
                  {thread.sentiment}
                </span>
              </div>

              <div className="thread-entities">
                {thread.entities.slice(0, 5).map((entity, idx) => (
                  <span key={idx} className="entity-tag">
                    {entity.text}
                  </span>
                ))}
                {thread.entities.length > 5 && (
                  <span className="entity-more">
                    +{thread.entities.length - 5} more
                  </span>
                )}
              </div>

              <div className="thread-meta">
                <small>
                  Created: {formatTimestamp(thread.createdAt)}
                </small>
                <small>
                  Last mentioned: {formatTimestamp(thread.lastUpdated)}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
