import { SCALE_MAP, buildScale } from "./scales";
import { buildSuggestedChordShape } from "./fretboard";
import type { ChordEvent, GeneratorSettings } from "./types";

const DIATONIC_QUALITIES = ["", "m", "m", "", "", "m", "dim"];
const BORROWED_QUALITIES = ["m", "", "", "m", "", "", ""];

export function buildDiatonicChords(settings: GeneratorSettings) {
  const scale = buildScale(settings.tonic, settings.scale);
  const definition = SCALE_MAP.get(settings.scale);

  if (!definition) {
    return [];
  }

  return scale.map((root, index) => {
    const triad = [
      scale[index % scale.length],
      scale[(index + 2) % scale.length],
      scale[(index + 4) % scale.length],
    ];
    const quality = DIATONIC_QUALITIES[index] ?? "";

    return {
      degree: index + 1,
      name: `${root}${quality}`,
      notes: triad,
      suggestedShape: buildSuggestedChordShape(
        triad,
        settings.tuning,
        settings.lowestFret,
        settings.highestFret,
      ),
    };
  });
}

export function generateChordProgression(settings: GeneratorSettings): ChordEvent[] {
  const chords = buildDiatonicChords(settings);
  const beatsPerMeasure = settings.timeSignature === "6/8" ? 6 : Number(settings.timeSignature[0]);
  const totalBeats = beatsPerMeasure * settings.measures;
  const chordDuration = totalBeats / Math.max(1, settings.chordCount);

  return Array.from({ length: settings.chordCount }, (_, chordIndex) => {
    const source = chords[chordIndex % chords.length];
    const borrowed =
      settings.allowBorrowedChords && chordIndex % 3 === 2
        ? {
            ...source,
            name: `${source.notes[0]}${BORROWED_QUALITIES[(source.degree - 1) % 7]}`,
          }
        : source;

    return {
      id: `chord-${chordIndex}`,
      name: borrowed.name,
      degree: borrowed.degree,
      notes: borrowed.notes,
      suggestedShape: borrowed.suggestedShape,
      startBeat: chordIndex * chordDuration,
      durationBeats: chordDuration,
    };
  });
}
