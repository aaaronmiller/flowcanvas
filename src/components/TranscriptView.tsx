import React, { useEffect, useRef } from 'react';
import '../styles/TranscriptView.css';

interface TranscriptViewProps {
  transcript: string[];
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcript arrives
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="transcript-view">
      <div className="transcript-header">
        <h3>Transcript</h3>
        <span className="transcript-count">{transcript.length} segments</span>
      </div>
      <div className="transcript-content" ref={containerRef}>
        {transcript.length === 0 ? (
          <div className="empty-transcript">
            <p>Transcript will appear here as you speak...</p>
          </div>
        ) : (
          transcript.map((text, index) => (
            <div key={index} className="transcript-segment">
              <span className="segment-number">{index + 1}</span>
              <span className="segment-text">{text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
