import React, { useState } from 'react';
import '../styles/WeirdSeedPanel.css';

interface WeirdSeedPanelProps {
  onSeedChange: (text: string) => void;
}

export function WeirdSeedPanel({ onSeedChange }: WeirdSeedPanelProps) {
  const [seedText, setSeedText] = useState('');

  const handleApply = () => {
    onSeedChange(seedText);
  };

  const handleClear = () => {
    setSeedText('');
    onSeedChange('');
  };

  const exampleSeeds = [
    'quantum physics theoretical framework particles entanglement superposition',
    'medieval knights castles dragons epic battles honor glory',
    'urban jungle concrete steel neon lights shadows hustle',
    'ocean depths mysterious creatures coral reefs currents waves',
    'space exploration galaxies nebulae cosmic infinite universe',
  ];

  const handleExample = (example: string) => {
    setSeedText(example);
    onSeedChange(example);
  };

  return (
    <div className="weird-seed-panel">
      <h3>Weird Seed</h3>
      <p className="seed-description">
        Inject unusual conceptual domains to force novel associations
      </p>

      <textarea
        className="seed-input"
        value={seedText}
        onChange={(e) => setSeedText(e.target.value)}
        placeholder="Enter text from any domain: scientific papers, historical texts, technical docs, random Wikipedia..."
        rows={6}
      />

      <div className="seed-actions">
        <button onClick={handleApply} className="btn-apply">
          Apply Seed
        </button>
        <button onClick={handleClear} className="btn-clear">
          Clear
        </button>
      </div>

      <div className="seed-examples">
        <h4>Examples:</h4>
        {exampleSeeds.map((example, index) => (
          <button
            key={index}
            className="example-btn"
            onClick={() => handleExample(example)}
            title={example}
          >
            {example.substring(0, 30)}...
          </button>
        ))}
      </div>
    </div>
  );
}
