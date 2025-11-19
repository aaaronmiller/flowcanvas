# FlowCanvas - Elite Performer Edition

A cognitive augmentation system for elite freestyle rappers that extends human working memory capacity beyond biological limits. FlowCanvas enables performers who can already maintain hour-long unbroken flows to operate at superhuman levels by offloading pattern tracking, rhyme discovery, and thematic branching to a real-time visual intelligence layer.

## What This Product Is

FlowCanvas is not a learning tool. This is not for beginners. This is performance enhancement technology for artists who have already mastered the fundamentals and hit the ceiling of what human cognition can do simultaneously.

The system provides:
- **Real-time rhyme detection** with phoneme-based matching using CMUdict
- **Semantic association discovery** through the Weird Seed system
- **Callback tracking** with temporal awareness across 30+ minute performances
- **Story thread monitoring** for narrative coherence
- **Phase detection** (opening/development/resolution) for structural guidance
- **Interactive tile canvas** with pin/fade mechanics
- **Force-directed rhyme graph** visualization
- **Auto-save** and session management
- **Recording** with automatic highlight detection

## Features

### Core Capabilities

#### 1. Rhyme Detection Engine
- CMUdict phoneme-based rhyme matching
- Perfect, near, assonance, consonance, and slant rhyme detection
- Phonetic distance ranking
- Usage state tracking to suggest only unused rhymes
- Categorization: Safe (familiar), Wacky (unexpected), Wild (extreme)

#### 2. Weird Seed System
- Inject arbitrary text from distant conceptual domains
- Semantic blending with current transcript
- Weirdness slider for real-time control
- Seed Mixer generates portmanteaus and compound phrases
- Forces genuinely novel word combinations

#### 3. Callback Engine
- Perfect memory of everything said across entire session
- Temporal awareness and phase detection
- Callback opportunity detection (rhyme + semantic relevance)
- Open thread tracking for narrative closure
- Dual-meaning construction

#### 4. Story Tracking
- Entity extraction (characters, places, things)
- Story thread detection and monitoring
- Sentiment analysis
- Theme tracking
- Narrative coherence assistance

#### 5. Visual Intelligence Layer
- Interactive tile canvas with suggestions
- Pin/unpin mechanics for saving discoveries
- Color-coded categories (safe/wacky/wild)
- Type indicators (rhyme/semantic/callback/compound)
- Force-directed graph showing rhyme relationships

#### 6. Performance Features
- Sub-300ms latency target
- Real-time audio capture and transcription
- Auto-save every 30 seconds
- Session state persistence
- Recording with metadata
- Hands-free operation support (MIDI/footswitch ready)

## Installation

### Prerequisites
- Node.js 18+ and npm
- macOS 12.0+ (Apple Silicon or Intel)
- Microphone access

### Setup

1. Install dependencies:
```bash
npm install
```

2. Development mode:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
npm run package
```

## Usage

### Starting a Session

1. Launch FlowCanvas
2. Grant microphone permissions when prompted
3. Click "Start Listening" or press Space
4. Begin freestyling - suggestions will appear in real-time

### Keyboard Shortcuts

- **Space**: Start/Stop listening
- **P**: Pin focused suggestion
- **C**: Clear all pinned suggestions
- **N**: New session
- **S**: Save session

### Tile Canvas

Suggestions appear as interactive tiles:
- **Green border**: Safe suggestions (familiar patterns)
- **Yellow border**: Wacky suggestions (unexpected bridges)
- **Red border**: Wild suggestions (extreme novelty)

Icons indicate suggestion type:
- 🎵 Rhyme match
- 🌀 Semantic/Weird Seed suggestion
- 🔁 Callback opportunity
- ⚡ Compound/portmanteau

Click tiles to pin/unpin. Pinned suggestions remain across transcript updates.

### Weird Seed

1. Navigate to Weird Seed panel
2. Paste text from any domain (scientific papers, historical texts, technical docs)
3. Click "Apply Seed"
4. Adjust Weirdness slider to control how aggressively system suggests seed words
5. Watch for semantic suggestions (🌀) in the tile canvas

### Rhyme Graph

Force-directed visualization showing:
- Nodes = suggested words
- Edges = phonetic similarity
- Colors = categories
- Size = pinned status

Drag nodes to rearrange. Helps visualize the complete rhyme space.

### Story Threads

Monitor open narrative threads:
- Characters introduced but not revisited
- Questions posed but not answered
- Conflicts established but not resolved

Use in resolution phase to create satisfying narrative closure.

### Phase Indicator

The system automatically detects your performance phase:
- **Opening** (0-5 minutes): Establishing themes and energy
- **Development** (5-25 minutes): Exploring and complicating
- **Resolution** (25+ minutes): Bringing threads together

Callbacks and structural suggestions adapt based on current phase.

## Technical Architecture

### Engine Components

- **RhymeEngine**: CMUdict + G2P phoneme matching
- **SemanticEngine**: NLP with Compromise.js for entity extraction and theme tracking
- **CallbackEngine**: Temporal awareness and phase detection
- **AudioEngine**: Web Audio API for capture and visualization
- **SpeechEngine**: Web Speech API for real-time transcription
- **FlowCanvasEngine**: Main orchestrator coordinating all systems

### Data Flow

```
Audio Input → Speech Recognition → Transcript
                                       ↓
                    ┌──────────────────┴──────────────────┐
                    ↓                  ↓                   ↓
              RhymeEngine      SemanticEngine      CallbackEngine
                    ↓                  ↓                   ↓
                    └──────────────────┬───────────────────┘
                                       ↓
                              Suggestion Generation
                                       ↓
                              Tile Canvas Display
```

### Performance Optimizations

- Incremental processing of transcript
- Efficient phoneme matching algorithms
- Debounced suggestion updates
- Smart caching of computed rhymes
- Lazy loading of dictionary data

## Session Management

### Auto-Save

Sessions auto-save every 30 seconds to:
```
~/Library/Application Support/FlowCanvas/sessions/
```

### Manual Save

Click "Save" or press Cmd+S to manually save current session.

### Export/Import

Sessions are stored as JSON with:
- Full transcript
- Used words history
- Pinned suggestions
- Seed text
- Settings (weirdness, density, fade rate)
- Timestamps and metadata

## Recording

When listening is active, FlowCanvas automatically records audio. Recordings are saved with session metadata for post-performance review.

Recordings saved to:
```
~/Library/Application Support/FlowCanvas/recordings/
```

## Advanced Features

### MIDI Controller Support (Configurable)

Map MIDI CC/note-on messages to:
- Pin/unpin suggestions
- Branch Wild (boost weirdness)
- Clear pinned
- Reset used state
- Phase controls

### Footswitch Support (Configurable)

USB footswitches can trigger:
- Start/stop listening
- Pin current suggestion
- Clear pinned
- Activate resolution mode

## Troubleshooting

### Microphone Not Working

1. Check System Preferences → Security & Privacy → Microphone
2. Ensure FlowCanvas has permission
3. Restart application

### Speech Recognition Not Starting

1. Verify Chrome/Safari speech API support
2. Check internet connection (some browsers require online speech recognition)
3. Try different browser

### Low Performance

1. Close other applications
2. Reduce suggestion density slider
3. Clear pinned suggestions periodically
4. Restart session if running 60+ minutes

### No Suggestions Appearing

1. Verify you're speaking clearly into microphone
2. Check transcript is updating
3. Increase density slider
4. Verify rhyme engine initialized (check console)

## Development

### Project Structure

```
flowcanvas/
├── electron/           # Electron main process
│   ├── main.ts        # Window management, IPC
│   └── preload.ts     # Context bridge
├── src/
│   ├── engine/        # Core engines
│   │   ├── audioEngine.ts
│   │   ├── callbackEngine.ts
│   │   ├── cmudict.ts
│   │   ├── flowCanvasEngine.ts
│   │   ├── rhymeEngine.ts
│   │   ├── semanticEngine.ts
│   │   └── speechEngine.ts
│   ├── components/    # React components
│   │   ├── ControlPanel.tsx
│   │   ├── PhaseIndicator.tsx
│   │   ├── RhymeGraph.tsx
│   │   ├── ThreadsPanel.tsx
│   │   ├── TileCanvas.tsx
│   │   ├── TranscriptView.tsx
│   │   └── WeirdSeedPanel.tsx
│   ├── styles/        # CSS modules
│   ├── App.tsx        # Main React component
│   ├── main.tsx       # React entry point
│   └── global.d.ts    # TypeScript declarations
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Building

```bash
# Development
npm run dev

# Build renderer
npm run build:renderer

# Build electron
npm run build:electron

# Package for distribution
npm run package
```

### Testing

- Test rhyme detection with known rhyme pairs
- Verify callback detection across time intervals
- Measure latency from speech to suggestion display
- Test session save/load with various state combinations

## Performance Targets

- **Latency**: Sub-300ms from speech to suggestion
- **Refresh rate**: 60fps UI
- **State capacity**: 500+ used rhymes, 50+ story threads, 1000+ word history
- **Session duration**: 60+ minutes without degradation
- **Audio quality**: Recording suitable for release without post-processing

## Credits

Built for elite freestyle rappers who have maxed out human baseline capacity and need superhuman capabilities to transcend biological limits.

Based on the FlowCanvas PRD (Elite Performer Edition) v3.0

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions:
1. Check troubleshooting section above
2. Review console logs for errors
3. File an issue with session details and error messages

---

**Note**: This is cognitive augmentation technology. The system extends memory and computational capacity - it does not replace skill, creativity, or artistic judgment. An amateur using this tool will still sound like an amateur. An elite performer using this tool can do things that are biologically impossible without it.
