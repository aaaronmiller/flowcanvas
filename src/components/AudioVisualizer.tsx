import React, { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../engine/audioEngine';
import '../styles/AudioVisualizer.css';

interface AudioVisualizerProps {
  audioEngine: AudioEngine | null;
  isListening: boolean;
}

export function AudioVisualizer({ audioEngine, isListening }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!audioEngine || !isListening || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const frequencyData = audioEngine.getFrequencyData();
      const level = audioEngine.getAudioLevel();

      if (frequencyData) {
        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw frequency bars
        const barWidth = canvas.width / frequencyData.length;
        const barSpacing = 1;

        for (let i = 0; i < frequencyData.length; i++) {
          const barHeight = (frequencyData[i] / 255) * canvas.height;
          const x = i * barWidth;
          const y = canvas.height - barHeight;

          // Gradient color based on frequency
          const hue = (i / frequencyData.length) * 120 + 120; // Green to cyan
          ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
          ctx.fillRect(x, y, barWidth - barSpacing, barHeight);
        }

        setAudioLevel(level);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioEngine, isListening]);

  const getLevelColor = () => {
    if (audioLevel > 0.7) return '#4ade80'; // Green - good level
    if (audioLevel > 0.3) return '#fbbf24'; // Yellow - moderate
    return '#64748b'; // Gray - low
  };

  const getLevelPercentage = () => {
    return Math.min(100, audioLevel * 100);
  };

  return (
    <div className="audio-visualizer">
      <div className="visualizer-header">
        <span className="visualizer-label">Audio Input</span>
        <span className="level-indicator" style={{ color: getLevelColor() }}>
          {Math.round(getLevelPercentage())}%
        </span>
      </div>

      <div className="waveform-container">
        <canvas
          ref={canvasRef}
          width={300}
          height={60}
          className="waveform-canvas"
        />
      </div>

      <div className="level-meter">
        <div
          className="level-bar"
          style={{
            width: `${getLevelPercentage()}%`,
            backgroundColor: getLevelColor(),
          }}
        />
      </div>

      {!isListening && (
        <div className="visualizer-overlay">
          <span>Not listening</span>
        </div>
      )}
    </div>
  );
}
