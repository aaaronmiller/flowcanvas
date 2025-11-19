import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Suggestion } from '../engine/flowCanvasEngine';
import '../styles/RhymeGraph.css';

interface RhymeGraphProps {
  suggestions: Suggestion[];
}

interface GraphNode {
  id: string;
  word: string;
  category: string;
  isPinned: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: GraphNode | string;
  target: GraphNode | string;
  value: number;
}

export function RhymeGraph({ suggestions }: RhymeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  useEffect(() => {
    if (!svgRef.current || suggestions.length === 0) return;

    const width = 400;
    const height = 500;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Create nodes
    const nodes: GraphNode[] = suggestions.map(s => ({
      id: s.word,
      word: s.word,
      category: s.category,
      isPinned: s.isPinned,
    }));

    // Create links based on phonetic similarity (simplified)
    const links: GraphLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const similarity = calculatePhoneticSimilarity(nodes[i].word, nodes[j].word);
        if (similarity > 0.5) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: similarity,
          });
        }
      }
    }

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode, GraphLink>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => 100 * (1 - d.value)))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));

    simulationRef.current = simulation;

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.value * 3);

    // Create nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation) as any);

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => d.isPinned ? 18 : 12)
      .attr('fill', d => getCategoryColor(d.category))
      .attr('stroke', d => d.isPinned ? '#fff' : 'none')
      .attr('stroke-width', 2);

    // Add text to nodes
    node.append('text')
      .text(d => d.word)
      .attr('font-size', 10)
      .attr('dx', 15)
      .attr('dy', 4)
      .attr('fill', '#e2e8f0');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [suggestions]);

  // Drag behavior
  function drag(simulation: d3.Simulation<GraphNode, GraphLink>) {
    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag<any, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return (
    <div className="rhyme-graph">
      <h3>Rhyme Network</h3>
      {suggestions.length > 0 ? (
        <svg ref={svgRef}></svg>
      ) : (
        <div className="empty-graph">
          <p>No suggestions to visualize</p>
        </div>
      )}
    </div>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'safe':
      return '#4ade80';
    case 'wacky':
      return '#fbbf24';
    case 'wild':
      return '#f87171';
    default:
      return '#94a3b8';
  }
}

function calculatePhoneticSimilarity(word1: string, word2: string): number {
  // Simple similarity based on common endings
  const len1 = word1.length;
  const len2 = word2.length;

  for (let i = 2; i <= Math.min(len1, len2, 4); i++) {
    const end1 = word1.slice(-i).toLowerCase();
    const end2 = word2.slice(-i).toLowerCase();
    if (end1 === end2) {
      return 0.5 + (i * 0.15);
    }
  }

  return 0.2;
}
