export type Mode = "riff" | "melody" | "chord";

export type ScaleId =
  | "major"
  | "naturalMinor"
  | "harmonicMinor"
  | "melodicMinor"
  | "pentatonicMajor"
  | "pentatonicMinor"
  | "blues"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "locrian";

export type TimeSignature = "4/4" | "3/4" | "6/8";

export type TechniqueFlags = {
  bends: boolean;
  slides: boolean;
  hammerOns: boolean;
};

export type Tuning = {
  name: string;
  strings: string[];
  isCustom?: boolean;
};

export type GeneratorSettings = {
  mode: Mode;
  tonic: string;
  scale: ScaleId;
  tempo: number;
  timeSignature: TimeSignature;
  measures: number;
  density: number;
  lowestFret: number;
  highestFret: number;
  tuning: Tuning;
  techniques: TechniqueFlags;
  chordCount: number;
  allowBorrowedChords: boolean;
};

export type ScaleDefinition = {
  id: ScaleId;
  name: string;
  intervals: number[];
};

export type NoteEvent = {
  id: string;
  pitchClass: string;
  midi: number;
  frequency: number;
  stringIndex: number;
  fret: number;
  stepIndex: number;
  startBeat: number;
  durationBeats: number;
  technique?: keyof TechniqueFlags;
};

export type ChordEvent = {
  id: string;
  name: string;
  degree: number;
  notes: string[];
  suggestedShape: Array<{ stringIndex: number; fret: number }>;
  startBeat: number;
  durationBeats: number;
};

export type GeneratedOutput = {
  notes: NoteEvent[];
  chords: ChordEvent[];
  tab: string[];
  summary: string;
};

export type FretPosition = {
  stringIndex: number;
  fret: number;
  midi: number;
  pitchClass: string;
  frequency: number;
};
