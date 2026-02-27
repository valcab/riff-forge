import type { Tuning } from "./types";

export const TUNINGS: Tuning[] = [
  { name: "Standard EADGBE", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
  { name: "Drop D", strings: ["D2", "A2", "D3", "G3", "B3", "E4"] },
];

const NOTE_PATTERN = /^([A-G]#?)(\d)$/;

export function parseNoteName(noteName: string) {
  const match = NOTE_PATTERN.exec(noteName);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  return { pitchClass: match[1], octave: Number(match[2]) };
}
