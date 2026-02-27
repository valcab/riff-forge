import { getPlayablePositions } from "./fretboard";
import { generateChordProgression } from "./chords";
import { buildScale } from "./scales";
import type { GeneratedOutput, GeneratorSettings, NoteEvent } from "./types";

function randomPick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function clampDensityToSubdivision(settings: GeneratorSettings) {
  if (settings.timeSignature === "6/8") {
    return settings.density > 60 ? 12 : 6;
  }

  if (settings.density > 70) {
    return 4;
  }

  if (settings.density > 35) {
    return 2;
  }

  return 1;
}

function createMotif(pool: ReturnType<typeof getPlayablePositions>, length: number) {
  return Array.from({ length }, () => randomPick(pool));
}

export function generateOutput(settings: GeneratorSettings): GeneratedOutput {
  const scaleNotes = new Set(buildScale(settings.tonic, settings.scale));
  const positions = getPlayablePositions(
    settings.tuning,
    settings.lowestFret,
    settings.highestFret,
  ).filter((position) => scaleNotes.has(position.pitchClass));

  const subdivision = clampDensityToSubdivision(settings);
  const beatsPerMeasure = settings.timeSignature === "6/8" ? 6 : Number(settings.timeSignature[0]);
  const stepsPerBeat = subdivision;
  const totalSteps = beatsPerMeasure * settings.measures * stepsPerBeat;
  const motif = createMotif(positions, Math.max(3, Math.ceil(settings.density / 25)));

  const notes: NoteEvent[] = Array.from({ length: totalSteps }, (_, stepIndex) => {
    const useMotif = stepIndex % (motif.length * 2) < motif.length;
    const position = useMotif
      ? motif[stepIndex % motif.length]
      : randomPick(positions);
    const durationBeats = 1 / stepsPerBeat;
    const techniques = [
      settings.techniques.bends ? "bends" : null,
      settings.techniques.slides ? "slides" : null,
      settings.techniques.hammerOns ? "hammerOns" : null,
    ].filter(Boolean) as Array<"bends" | "slides" | "hammerOns">;

    return {
      id: `note-${stepIndex}`,
      pitchClass: position.pitchClass,
      midi: position.midi,
      frequency: position.frequency,
      stringIndex: position.stringIndex,
      fret: position.fret,
      stepIndex,
      startBeat: stepIndex / stepsPerBeat,
      durationBeats,
      technique:
        techniques.length > 0 && stepIndex % 5 === 4
          ? techniques[stepIndex % techniques.length]
          : undefined,
    };
  }).filter((_, index) => index % (settings.mode === "riff" ? 1 : 2) === 0);

  const chords = settings.mode === "chord" ? generateChordProgression(settings) : [];
  const tab = buildTab(settings, notes, chords);
  const summary =
    settings.mode === "chord"
      ? `Forged ${chords.length} chords across ${settings.measures} bars.`
      : `Forged ${notes.length} notes with a ${subdivision > 2 ? "busy" : "steady"} pulse.`;

  return { notes, chords, tab, summary };
}

function buildTab(
  settings: GeneratorSettings,
  notes: NoteEvent[],
  chords: GeneratedOutput["chords"],
) {
  const stringCount = settings.tuning.strings.length;
  const rows = Array.from({ length: stringCount }, (_, stringIndex) => {
    const label = settings.tuning.strings[stringCount - stringIndex - 1].padEnd(3, " ");
    return `${label}|`;
  });

  const sortedNotes =
    settings.mode === "chord"
      ? chords.flatMap((chord) =>
          chord.suggestedShape.map((shape, index) => ({
            stringIndex: shape.stringIndex,
            fret: shape.fret,
            stepIndex: Math.round(chord.startBeat * 2) + index,
          })),
        )
      : notes.map((note) => ({
          stringIndex: note.stringIndex,
          fret: note.fret,
          stepIndex: note.stepIndex,
        }));

  const totalSteps = Math.max(16, ...sortedNotes.map((item) => item.stepIndex + 1));

  rows.forEach((row, rowIndex) => {
    const originalStringIndex = stringCount - rowIndex - 1;
    let line = row;

    for (let step = 0; step < totalSteps; step += 1) {
      const entry = sortedNotes.find(
        (note) => note.stepIndex === step && note.stringIndex === originalStringIndex,
      );
      line += entry ? `${String(entry.fret).padEnd(2, "-")}` : "--";
    }

    rows[rowIndex] = line;
  });

  return rows;
}
