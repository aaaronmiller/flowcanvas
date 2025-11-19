// CMUdict phoneme dictionary - Core pronunciation data
// This is a subset with common words - full dictionary would be loaded from external file

export interface PhonemeEntry {
  word: string;
  phonemes: string[];
}

export class CMUDictionary {
  private dict: Map<string, string[][]> = new Map();

  constructor() {
    this.loadDictionary();
  }

  private loadDictionary() {
    // Core CMUdict entries - in production, load from full dictionary file
    const entries: Array<[string, string[]]> = [
      // Common words for demo/testing
      ['the', ['DH', 'AH0']],
      ['be', ['B', 'IY1']],
      ['to', ['T', 'UW1']],
      ['of', ['AH1', 'V']],
      ['and', ['AE1', 'N', 'D']],
      ['a', ['AH0']],
      ['in', ['IH1', 'N']],
      ['that', ['DH', 'AE1', 'T']],
      ['have', ['HH', 'AE1', 'V']],
      ['i', ['AY1']],
      ['it', ['IH1', 'T']],
      ['for', ['F', 'AO1', 'R']],
      ['not', ['N', 'AA1', 'T']],
      ['on', ['AA1', 'N']],
      ['with', ['W', 'IH1', 'DH']],
      ['he', ['HH', 'IY1']],
      ['as', ['AE1', 'Z']],
      ['you', ['Y', 'UW1']],
      ['do', ['D', 'UW1']],
      ['at', ['AE1', 'T']],

      // Rhyming words
      ['cat', ['K', 'AE1', 'T']],
      ['hat', ['HH', 'AE1', 'T']],
      ['bat', ['B', 'AE1', 'T']],
      ['rat', ['R', 'AE1', 'T']],
      ['mat', ['M', 'AE1', 'T']],
      ['sat', ['S', 'AE1', 'T']],
      ['fat', ['F', 'AE1', 'T']],
      ['pat', ['P', 'AE1', 'T']],

      ['day', ['D', 'EY1']],
      ['way', ['W', 'EY1']],
      ['say', ['S', 'EY1']],
      ['play', ['P', 'L', 'EY1']],
      ['stay', ['S', 'T', 'EY1']],
      ['may', ['M', 'EY1']],
      ['pay', ['P', 'EY1']],
      ['ray', ['R', 'EY1']],

      ['night', ['N', 'AY1', 'T']],
      ['light', ['L', 'AY1', 'T']],
      ['right', ['R', 'AY1', 'T']],
      ['fight', ['F', 'AY1', 'T']],
      ['sight', ['S', 'AY1', 'T']],
      ['might', ['M', 'AY1', 'T']],
      ['tight', ['T', 'AY1', 'T']],
      ['bright', ['B', 'R', 'AY1', 'T']],

      ['mind', ['M', 'AY1', 'N', 'D']],
      ['find', ['F', 'AY1', 'N', 'D']],
      ['kind', ['K', 'AY1', 'N', 'D']],
      ['blind', ['B', 'L', 'AY1', 'N', 'D']],
      ['grind', ['G', 'R', 'AY1', 'N', 'D']],
      ['behind', ['B', 'IH0', 'HH', 'AY1', 'N', 'D']],

      ['street', ['S', 'T', 'R', 'IY1', 'T']],
      ['beat', ['B', 'IY1', 'T']],
      ['heat', ['HH', 'IY1', 'T']],
      ['meet', ['M', 'IY1', 'T']],
      ['feet', ['F', 'IY1', 'T']],
      ['seat', ['S', 'IY1', 'T']],
      ['neat', ['N', 'IY1', 'T']],
      ['complete', ['K', 'AH0', 'M', 'P', 'L', 'IY1', 'T']],

      ['flow', ['F', 'L', 'OW1']],
      ['show', ['SH', 'OW1']],
      ['go', ['G', 'OW1']],
      ['know', ['N', 'OW1']],
      ['grow', ['G', 'R', 'OW1']],
      ['blow', ['B', 'L', 'OW1']],
      ['slow', ['S', 'L', 'OW1']],
      ['glow', ['G', 'L', 'OW1']],

      ['time', ['T', 'AY1', 'M']],
      ['rhyme', ['R', 'AY1', 'M']],
      ['climb', ['K', 'L', 'AY1', 'M']],
      ['prime', ['P', 'R', 'AY1', 'M']],
      ['crime', ['K', 'R', 'AY1', 'M']],
      ['dime', ['D', 'AY1', 'M']],
      ['lime', ['L', 'AY1', 'M']],
      ['sublime', ['S', 'AH0', 'B', 'L', 'AY1', 'M']],

      // Common rap words
      ['freestyle', ['F', 'R', 'IY1', 'S', 'T', 'AY2', 'L']],
      ['rapper', ['R', 'AE1', 'P', 'ER0']],
      ['verse', ['V', 'ER1', 'S']],
      ['rhyme', ['R', 'AY1', 'M']],
      ['beat', ['B', 'IY1', 'T']],
      ['flow', ['F', 'L', 'OW1']],
      ['mic', ['M', 'AY1', 'K']],
      ['stage', ['S', 'T', 'EY1', 'JH']],
      ['crowd', ['K', 'R', 'AW1', 'D']],
      ['sound', ['S', 'AW1', 'N', 'D']],

      // More words
      ['make', ['M', 'EY1', 'K']],
      ['take', ['T', 'EY1', 'K']],
      ['break', ['B', 'R', 'EY1', 'K']],
      ['shake', ['SH', 'EY1', 'K']],
      ['wake', ['W', 'EY1', 'K']],
      ['fake', ['F', 'EY1', 'K']],

      ['word', ['W', 'ER1', 'D']],
      ['heard', ['HH', 'ER1', 'D']],
      ['bird', ['B', 'ER1', 'D']],
      ['third', ['TH', 'ER1', 'D']],

      ['soul', ['S', 'OW1', 'L']],
      ['goal', ['G', 'OW1', 'L']],
      ['role', ['R', 'OW1', 'L']],
      ['whole', ['HH', 'OW1', 'L']],
      ['control', ['K', 'AH0', 'N', 'T', 'R', 'OW1', 'L']],

      ['real', ['R', 'IY1', 'L']],
      ['feel', ['F', 'IY1', 'L']],
      ['deal', ['D', 'IY1', 'L']],
      ['steal', ['S', 'T', 'IY1', 'L']],
      ['reveal', ['R', 'IH0', 'V', 'IY1', 'L']],
    ];

    for (const [word, phonemes] of entries) {
      const key = word.toLowerCase();
      if (!this.dict.has(key)) {
        this.dict.set(key, []);
      }
      this.dict.get(key)!.push(phonemes);
    }
  }

  getPhonemes(word: string): string[][] {
    return this.dict.get(word.toLowerCase()) || [];
  }

  hasWord(word: string): boolean {
    return this.dict.has(word.toLowerCase());
  }

  // G2P (Grapheme-to-Phoneme) fallback for unknown words
  graphemeToPhoneme(word: string): string[] {
    // Simple rule-based G2P for unknown words
    // In production, use a proper G2P model
    const phonemes: string[] = [];
    const chars = word.toLowerCase().split('');

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const nextChar = chars[i + 1] || '';

      // Very basic phoneme mapping
      if (char === 'a') {
        if (nextChar === 'y') {
          phonemes.push('EY1');
          i++;
        } else {
          phonemes.push('AE1');
        }
      } else if (char === 'e') {
        if (nextChar === 'e') {
          phonemes.push('IY1');
          i++;
        } else {
          phonemes.push('EH1');
        }
      } else if (char === 'i') {
        if (nextChar === 'gh') {
          phonemes.push('AY1');
        } else {
          phonemes.push('IH1');
        }
      } else if (char === 'o') {
        if (nextChar === 'w') {
          phonemes.push('OW1');
          i++;
        } else {
          phonemes.push('AA1');
        }
      } else if (char === 'u') {
        phonemes.push('AH1');
      } else if (char === 'b') {
        phonemes.push('B');
      } else if (char === 'c') {
        if (nextChar === 'h') {
          phonemes.push('CH');
          i++;
        } else {
          phonemes.push('K');
        }
      } else if (char === 'd') {
        phonemes.push('D');
      } else if (char === 'f') {
        phonemes.push('F');
      } else if (char === 'g') {
        phonemes.push('G');
      } else if (char === 'h') {
        phonemes.push('HH');
      } else if (char === 'j') {
        phonemes.push('JH');
      } else if (char === 'k') {
        phonemes.push('K');
      } else if (char === 'l') {
        phonemes.push('L');
      } else if (char === 'm') {
        phonemes.push('M');
      } else if (char === 'n') {
        phonemes.push('N');
      } else if (char === 'p') {
        phonemes.push('P');
      } else if (char === 'q') {
        phonemes.push('K', 'W');
      } else if (char === 'r') {
        phonemes.push('R');
      } else if (char === 's') {
        if (nextChar === 'h') {
          phonemes.push('SH');
          i++;
        } else {
          phonemes.push('S');
        }
      } else if (char === 't') {
        if (nextChar === 'h') {
          phonemes.push('TH');
          i++;
        } else {
          phonemes.push('T');
        }
      } else if (char === 'v') {
        phonemes.push('V');
      } else if (char === 'w') {
        phonemes.push('W');
      } else if (char === 'x') {
        phonemes.push('K', 'S');
      } else if (char === 'y') {
        phonemes.push('Y');
      } else if (char === 'z') {
        phonemes.push('Z');
      }
    }

    return phonemes.length > 0 ? phonemes : ['UNK'];
  }

  getAllWords(): string[] {
    return Array.from(this.dict.keys());
  }
}

export const cmudict = new CMUDictionary();
