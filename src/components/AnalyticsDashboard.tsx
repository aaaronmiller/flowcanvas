import React, { useState, useEffect } from 'react';
import { FlowCanvasEngine } from '../engine/flowCanvasEngine';
import { SessionAnalytics } from '../engine/analyticsEngine';
import '../styles/AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
  engine: FlowCanvasEngine | null;
}

export function AnalyticsDashboard({ engine }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);

  useEffect(() => {
    if (!engine) return;

    const interval = setInterval(() => {
      const stats = engine.getAnalytics();
      setAnalytics(stats);
    }, 2000);

    return () => clearInterval(interval);
  }, [engine]);

  if (!analytics) {
    return (
      <div className="analytics-dashboard">
        <p className="no-data">No analytics data yet...</p>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getCallbackRate = (): number => {
    if (analytics.callbackOpportunities === 0) return 0;
    return (analytics.callbacksExecuted / analytics.callbackOpportunities) * 100;
  };

  return (
    <div className="analytics-dashboard">
      <h3>Session Analytics</h3>

      <div className="analytics-grid">
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-label">Duration</div>
            <div className="stat-value">{formatDuration(analytics.sessionDuration)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-label">Words</div>
            <div className="stat-value">{analytics.totalWords}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎵</div>
          <div className="stat-content">
            <div className="stat-label">Rhyme Variety</div>
            <div className="stat-value">{analytics.rhymeVariety}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔁</div>
          <div className="stat-content">
            <div className="stat-label">Callbacks</div>
            <div className="stat-value">
              {analytics.callbacksExecuted}/{analytics.callbackOpportunities}
            </div>
            <div className="stat-subtitle">{Math.round(getCallbackRate())}% success</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🌀</div>
          <div className="stat-content">
            <div className="stat-label">Metaphor Density</div>
            <div className="stat-value">{analytics.metaphorDensity.toFixed(1)}</div>
            <div className="stat-subtitle">per minute</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Acceptance Rate</div>
            <div className="stat-value">
              {Math.round(analytics.suggestionAcceptanceRate * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div className="category-distribution">
        <h4>Category Usage</h4>
        <div className="category-bars">
          <div className="category-bar">
            <span className="bar-label">Safe</span>
            <div className="bar-container">
              <div
                className="bar-fill safe"
                style={{
                  width: `${(analytics.categoryDistribution.safe /
                    (analytics.categoryDistribution.safe +
                     analytics.categoryDistribution.wacky +
                     analytics.categoryDistribution.wild || 1)) * 100}%`
                }}
              />
            </div>
            <span className="bar-count">{analytics.categoryDistribution.safe}</span>
          </div>

          <div className="category-bar">
            <span className="bar-label">Wacky</span>
            <div className="bar-container">
              <div
                className="bar-fill wacky"
                style={{
                  width: `${(analytics.categoryDistribution.wacky /
                    (analytics.categoryDistribution.safe +
                     analytics.categoryDistribution.wacky +
                     analytics.categoryDistribution.wild || 1)) * 100}%`
                }}
              />
            </div>
            <span className="bar-count">{analytics.categoryDistribution.wacky}</span>
          </div>

          <div className="category-bar">
            <span className="bar-label">Wild</span>
            <div className="bar-container">
              <div
                className="bar-fill wild"
                style={{
                  width: `${(analytics.categoryDistribution.wild /
                    (analytics.categoryDistribution.safe +
                     analytics.categoryDistribution.wacky +
                     analytics.categoryDistribution.wild || 1)) * 100}%`
                }}
              />
            </div>
            <span className="bar-count">{analytics.categoryDistribution.wild}</span>
          </div>
        </div>
      </div>

      {analytics.peakFlowMoments.length > 0 && (
        <div className="peak-moments">
          <h4>Peak Flow Moments 🔥</h4>
          <div className="moments-list">
            {analytics.peakFlowMoments.slice(-5).reverse().map((moment, idx) => (
              <div key={idx} className="moment-item">
                <div className="moment-time">{formatDuration(Math.floor(moment.timestamp / 1000))}</div>
                <div className="moment-reason">{moment.reason}</div>
                <div className="moment-score">{Math.round(moment.score * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.phaseTransitions.length > 0 && (
        <div className="phase-timeline">
          <h4>Phase Timeline</h4>
          <div className="timeline">
            {analytics.phaseTransitions.map((transition, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <span className="timeline-phase">{transition.phase}</span>
                  <span className="timeline-time">
                    {formatDuration(Math.floor(transition.timestamp / 1000))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
