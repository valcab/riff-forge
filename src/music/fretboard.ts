import { midiToFrequency, midiToNote, noteToMidi } from "./scales";
import { parseNoteName } from "./tuning";
import type { FretPosition, Tuning } from "./types";

export function getPlayablePositions(
  tuning: Tuning,
  lowestFret: number,
  highestFret: number,
) {
  const positions: FretPosition[] = [];

  tuning.strings.forEach((stringNote, stringIndex) => {
    const { pitchClass, octave } = parseNoteName(stringNote);
    const openMidi = noteToMidi(pitchClass, octave);

    for (let fret = lowestFret; fret <= highestFret; fret += 1) {
      const midi = openMidi + fret;
      positions.push({
        stringIndex,
        fret,
        midi,
        pitchClass: midiToNote(midi),
        frequency: midiToFrequency(midi),
      });
    }
  });

  return positions;
}

export function buildSuggestedChordShape(
  notes: string[],
  tuning: Tuning,
  lowestFret: number,
  highestFret: number,
) {
  const positions = getPlayablePositions(tuning, lowestFret, highestFret);

  return notes
    .map((target, stringIndex) => {
      const position = positions.find(
        (candidate) =>
          candidate.stringIndex === stringIndex && candidate.pitchClass === target,
      );

      return position
        ? { stringIndex: position.stringIndex, fret: position.fret }
        : { stringIndex, fret: lowestFret };
    })
    .slice(0, tuning.strings.length);
}
