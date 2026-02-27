import type { ScaleDefinition, ScaleId } from "./types";

export const TONICS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const SCALE_DEFINITIONS: ScaleDefinition[] = [
  { id: "major", name: "Major", intervals: [0, 2, 4, 5, 7, 9, 11] },
  {
    id: "naturalMinor",
    name: "Natural Minor",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  {
    id: "harmonicMinor",
    name: "Harmonic Minor",
    intervals: [0, 2, 3, 5, 7, 8, 11],
  },
  {
    id: "melodicMinor",
    name: "Melodic Minor",
    intervals: [0, 2, 3, 5, 7, 9, 11],
  },
  {
    id: "pentatonicMajor",
    name: "Pentatonic Major",
    intervals: [0, 2, 4, 7, 9],
  },
  {
    id: "pentatonicMinor",
    name: "Pentatonic Minor",
    intervals: [0, 3, 5, 7, 10],
  },
  { id: "blues", name: "Blues", intervals: [0, 3, 5, 6, 7, 10] },
  { id: "dorian", name: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: "phrygian", name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: "lydian", name: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
  {
    id: "mixolydian",
    name: "Mixolydian",
    intervals: [0, 2, 4, 5, 7, 9, 10],
  },
  { id: "locrian", name: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10] },
];

export const SCALE_MAP = new Map<ScaleId, ScaleDefinition>(
  SCALE_DEFINITIONS.map((scale) => [scale.id, scale]),
);

export const NOTE_INDEX: Record<string, number> = Object.fromEntries(
  TONICS.map((note, index) => [note, index]),
);

export function buildScale(tonic: string, scaleId: ScaleId): string[] {
  const tonicIndex = NOTE_INDEX[tonic];
  const scale = SCALE_MAP.get(scaleId);

  if (tonicIndex === undefined || !scale) {
    throw new Error("Unsupported tonic or scale");
  }

  return scale.intervals.map((interval) => TONICS[(tonicIndex + interval) % 12]);
}

export function noteToMidi(note: string, octave: number) {
  return NOTE_INDEX[note] + (octave + 1) * 12;
}

export function midiToNote(midi: number) {
  return TONICS[((midi % 12) + 12) % 12];
}

export function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}
