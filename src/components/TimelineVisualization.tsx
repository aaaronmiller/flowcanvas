import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { HistoricalMoment } from '../engine/callbackEngine';
import '../styles/TimelineVisualization.css';

interface TimelineVisualizationProps {
  history: HistoricalMoment[];
  currentTime: number;
}

export function TimelineVisualization({ history, currentTime }: TimelineVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || history.length === 0) return;

    const width = 800;
    const height = 200;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const startTime = history[0].timestamp;
    const endTime = currentTime;

    // Time scale
    const xScale = d3.scaleLinear()
      .domain([startTime, endTime])
      .range([margin.left, width - margin.right]);

    // Significance scale
    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top]);

    // Draw timeline axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => {
        const seconds = Math.floor((Number(d) - startTime) / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      });

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .attr('color', '#64748b');

    // Draw timeline line
    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', '#374151')
      .attr('stroke-width', 2);

    // Draw moments as circles
    const moments = svg.selectAll('circle.moment')
      .data(history)
      .join('circle')
      .attr('class', 'moment')
      .attr('cx', d => xScale(d.timestamp))
      .attr('cy', d => yScale(d.significance))
      .attr('r', d => 4 + (d.significance * 6))
      .attr('fill', d => {
        if (d.entities.length > 2) return '#f87171'; // Many entities = red
        if (d.significance > 0.7) return '#fbbf24'; // High significance = yellow
        return '#4ade80'; // Normal = green
      })
      .attr('opacity', 0.8)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Add tooltips
    moments.append('title')
      .text(d => `${d.text.substring(0, 50)}...\nSignificance: ${(d.significance * 100).toFixed(0)}%\nEntities: ${d.entities.join(', ')}`);

    // Draw entity labels for significant moments
    const significantMoments = history.filter(m => m.significance > 0.7);

    svg.selectAll('text.entity-label')
      .data(significantMoments)
      .join('text')
      .attr('class', 'entity-label')
      .attr('x', d => xScale(d.timestamp))
      .attr('y', d => yScale(d.significance) - 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#e2e8f0')
      .text(d => d.entities[0] || '');

    // Draw current time indicator
    svg.append('line')
      .attr('class', 'current-time')
      .attr('x1', xScale(currentTime))
      .attr('x2', xScale(currentTime))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

  }, [history, currentTime]);

  return (
    <div className="timeline-visualization">
      <h3>Session Timeline</h3>
      <p className="timeline-description">
        Visual timeline showing significant moments, entities, and callbacks
      </p>
      {history.length > 0 ? (
        <svg ref={svgRef}></svg>
      ) : (
        <div className="empty-timeline">
          <p>Timeline will appear as you perform...</p>
        </div>
      )}

      <div className="timeline-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#4ade80' }}></span>
          <span>Normal moment</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#fbbf24' }}></span>
          <span>Significant moment</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#f87171' }}></span>
          <span>Multiple entities</span>
        </div>
      </div>
    </div>
  );
}
