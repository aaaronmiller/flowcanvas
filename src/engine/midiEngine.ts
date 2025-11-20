import { WebMidi, Input, NoteMessageEvent, ControlChangeMessageEvent } from 'webmidi';

export interface MIDIMapping {
  pin: number;           // CC or note number for pin action
  clearPinned: number;   // CC or note for clear pinned
  boostWeirdness: number; // CC for weirdness boost
  branchWild: number;    // CC or note for wild branch
  nextFamily: number;    // CC or note for next rhyme family
  toggleListening: number; // CC or note for start/stop
  newSession: number;    // CC or note for new session
}

export type MIDIActionCallback = (action: string, value?: number) => void;

export class MIDIEngine {
  private input: Input | null = null;
  private onAction: MIDIActionCallback | null = null;
  private mapping: MIDIMapping = {
    pin: 64,           // Sustain pedal
    clearPinned: 65,
    boostWeirdness: 1, // Mod wheel
    branchWild: 71,
    nextFamily: 72,
    toggleListening: 60,
    newSession: 62,
  };

  constructor() {}

  // Initialize MIDI
  async initialize(): Promise<boolean> {
    try {
      await WebMidi.enable();
      console.log('MIDI enabled successfully');

      // List available inputs
      const inputs = WebMidi.inputs;
      console.log('Available MIDI inputs:', inputs.map(i => i.name));

      if (inputs.length > 0) {
        // Use first input by default
        this.input = inputs[0];
        this.setupListeners();
        console.log(`Connected to MIDI input: ${this.input.name}`);
        return true;
      } else {
        console.log('No MIDI inputs found');
        return false;
      }
    } catch (error) {
      console.error('Failed to enable MIDI:', error);
      return false;
    }
  }

  // Setup MIDI event listeners
  private setupListeners(): void {
    if (!this.input) return;

    // Listen for note on events
    this.input.addListener('noteon', (e: NoteMessageEvent) => {
      this.handleNoteOn(e.note.number);
    });

    // Listen for control change events
    this.input.addListener('controlchange', (e: ControlChangeMessageEvent) => {
      this.handleControlChange(e.controller.number, e.value);
    });
  }

  // Handle note on
  private handleNoteOn(note: number): void {
    if (!this.onAction) return;

    if (note === this.mapping.pin) {
      this.onAction('pin');
    } else if (note === this.mapping.clearPinned) {
      this.onAction('clearPinned');
    } else if (note === this.mapping.branchWild) {
      this.onAction('branchWild');
    } else if (note === this.mapping.nextFamily) {
      this.onAction('nextFamily');
    } else if (note === this.mapping.toggleListening) {
      this.onAction('toggleListening');
    } else if (note === this.mapping.newSession) {
      this.onAction('newSession');
    }
  }

  // Handle control change
  private handleControlChange(controller: number, value: number): void {
    if (!this.onAction) return;

    if (controller === this.mapping.boostWeirdness) {
      // Mod wheel controls weirdness (0-127 -> 0-1)
      const normalized = value / 127;
      this.onAction('setWeirdness', normalized);
    } else if (controller === this.mapping.pin) {
      if (value > 64) {
        this.onAction('pin');
      }
    } else if (controller === this.mapping.clearPinned) {
      if (value > 64) {
        this.onAction('clearPinned');
      }
    }
  }

  // Set action callback
  setActionCallback(callback: MIDIActionCallback): void {
    this.onAction = callback;
  }

  // Update mapping
  updateMapping(mapping: Partial<MIDIMapping>): void {
    this.mapping = { ...this.mapping, ...mapping };
  }

  // Get current mapping
  getMapping(): MIDIMapping {
    return { ...this.mapping };
  }

  // List available inputs
  getAvailableInputs(): string[] {
    return WebMidi.inputs.map(input => input.name);
  }

  // Select input by name
  selectInput(name: string): boolean {
    const input = WebMidi.getInputByName(name);
    if (input) {
      // Remove listeners from old input
      if (this.input) {
        this.input.removeListener();
      }

      this.input = input;
      this.setupListeners();
      console.log(`Switched to MIDI input: ${name}`);
      return true;
    }
    return false;
  }

  // Check if MIDI is available
  isAvailable(): boolean {
    return WebMidi.enabled && this.input !== null;
  }

  // Cleanup
  cleanup(): void {
    if (this.input) {
      this.input.removeListener();
      this.input = null;
    }

    if (WebMidi.enabled) {
      WebMidi.disable();
    }
  }
}

// Footswitch support (simple USB HID footswitch)
export class FootswitchEngine {
  private onAction: MIDIActionCallback | null = null;
  private keyMapping = {
    F13: 'pin',           // Common footswitch key
    F14: 'clearPinned',
    F15: 'toggleListening',
    F16: 'branchWild',
  };

  constructor() {
    this.setupListener();
  }

  private setupListener(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const action = this.keyMapping[e.key as keyof typeof this.keyMapping];
      if (action && this.onAction) {
        e.preventDefault();
        this.onAction(action);
      }
    });
  }

  setActionCallback(callback: MIDIActionCallback): void {
    this.onAction = callback;
  }

  updateMapping(key: string, action: string): void {
    (this.keyMapping as any)[key] = action;
  }

  getMapping() {
    return { ...this.keyMapping };
  }
}
