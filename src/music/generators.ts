import { buildDiatonicChords, generateChordProgression } from "./chords";
import { getPlayablePositions } from "./fretboard";
import { buildScale } from "./scales";
import type {
  ChordEvent,
  FretPosition,
  GeneratedOutput,
  GeneratorSettings,
  NoteEvent,
} from "./types";

type RhythmHit = {
  stepOffset: number;
  durationSteps: number;
};

type MotifShape = {
  rhythm: RhythmHit[];
  relativeMidis: number[];
};

function weightedPick<T>(items: T[], getWeight: (item: T) => number) {
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0.001, getWeight(item)), 0);
  let cursor = Math.random() * totalWeight;

  for (const item of items) {
    cursor -= Math.max(0.001, getWeight(item));
    if (cursor <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function getBeatsPerMeasure(settings: GeneratorSettings) {
  return settings.timeSignature === "6/8" ? 6 : Number(settings.timeSignature[0]);
}

function getStepsPerBeat(settings: GeneratorSettings) {
  if (settings.timeSignature === "6/8") {
    if (settings.density >= 70) {
      return 3;
    }

    return settings.density >= 40 ? 2 : 1;
  }

  if (settings.density >= 72) {
    return 4;
  }

  if (settings.density >= 38) {
    return 2;
  }

  return 1;
}

function buildRhythmOptions(settings: GeneratorSettings, remainingSteps: number) {
  const short = settings.mode === "riff" ? 1 : 2;
  const options = [short, 2, 4].filter((duration) => duration <= remainingSteps);

  if (settings.timeSignature === "6/8" && remainingSteps >= 3) {
    options.push(3);
  }

  return [...new Set(options)].sort((left, right) => left - right);
}

function generateMeasureRhythm(
  settings: GeneratorSettings,
  stepsPerMeasure: number,
  motifTemplate?: RhythmHit[],
) {
  if (
    motifTemplate &&
    motifTemplate.length > 0 &&
    motifTemplate[motifTemplate.length - 1].stepOffset < stepsPerMeasure
  ) {
    return motifTemplate
      .map((hit) => ({ ...hit }))
      .filter((hit) => hit.stepOffset < stepsPerMeasure);
  }

  const hits: RhythmHit[] = [];
  let step = 0;
  const restBias = Math.max(0.08, 0.34 - settings.density / 420);

  while (step < stepsPerMeasure) {
    const beatBoundary = step % getStepsPerBeat(settings) === 0;
    const strongBeat = step % (getStepsPerBeat(settings) * 2) === 0;
    const shouldPlay =
      step === 0 ||
      strongBeat ||
      Math.random() > restBias + (beatBoundary ? 0.05 : 0.12);

    if (!shouldPlay) {
      step += 1;
      continue;
    }

    const remainingSteps = stepsPerMeasure - step;
    const durations = buildRhythmOptions(settings, remainingSteps);
    const durationSteps = weightedPick(durations, (duration) => {
      const longBias = strongBeat ? 1.4 : 1;
      const densityBias = settings.density >= 65 ? 5 - duration : duration;
      return Math.max(0.3, densityBias) * longBias;
    });

    hits.push({ stepOffset: step, durationSteps });
    step += durationSteps;
  }

  if (hits.length === 0) {
    return [{ stepOffset: 0, durationSteps: Math.min(stepsPerMeasure, 2) }];
  }

  return hits;
}

function chooseMeasureGuideChords(settings: GeneratorSettings) {
  const progression = generateChordProgression({
    ...settings,
    chordCount: Math.max(settings.measures, Math.min(4, settings.chordCount)),
  });

  return Array.from({ length: settings.measures }, (_, measureIndex) => {
    return progression[Math.min(measureIndex, progression.length - 1)];
  });
}

function findCentralAnchor(
  positions: FretPosition[],
  pitchClasses: string[],
  mode: GeneratorSettings["mode"],
) {
  const matching = positions.filter((position) => pitchClasses.includes(position.pitchClass));
  const pool = matching.length > 0 ? matching : positions;
  const centerMidi = (pool[0].midi + pool[pool.length - 1].midi) / 2;

  return weightedPick(pool, (position) => {
    const distance = Math.abs(position.midi - centerMidi);
    const fretBias = mode === "riff" ? 1 / (1 + position.fret * 0.08) : 1;
    return (12 - Math.min(11, distance)) * fretBias;
  });
}

function choosePosition(
  positions: FretPosition[],
  previous: FretPosition | null,
  anchor: FretPosition,
  targetPitchClasses: string[],
  settings: GeneratorSettings,
  isPhraseEnding: boolean,
  motifMidiTarget?: number,
) {
  const maxLeap = settings.mode === "melody" ? 7 : 5;
  const targetPool = positions.filter((position) =>
    targetPitchClasses.includes(position.pitchClass),
  );
  const pitchPool = targetPool.length > 0 ? targetPool : positions;
  const constrainedPool =
    previous === null
      ? pitchPool
      : pitchPool.filter((position) => Math.abs(position.midi - previous.midi) <= maxLeap + 2);
  const pool = constrainedPool.length > 0 ? constrainedPool : pitchPool;

  return weightedPick(pool, (position) => {
    const previousDistance = previous ? Math.abs(position.midi - previous.midi) : 0;
    const anchorDistance = Math.abs(position.midi - anchor.midi);
    const motifDistance = motifMidiTarget === undefined ? 0 : Math.abs(position.midi - motifMidiTarget);
    const cadenceBonus =
      isPhraseEnding && targetPitchClasses.includes(position.pitchClass) ? 4 : 1;
    const stringBias =
      previous && settings.mode === "riff" && previous.stringIndex === position.stringIndex
        ? 1.4
        : 1;

    return (
      (cadenceBonus * stringBias * 10) /
      (1 + previousDistance * 1.3 + anchorDistance * 0.45 + motifDistance * 0.6)
    );
  });
}

function attachTechnique(
  settings: GeneratorSettings,
  noteIndex: number,
  previous: FretPosition | null,
  current: FretPosition,
) {
  const enabled = [
    settings.techniques.bends ? "bends" : null,
    settings.techniques.slides ? "slides" : null,
    settings.techniques.hammerOns ? "hammerOns" : null,
  ].filter(Boolean) as Array<"bends" | "slides" | "hammerOns">;

  if (enabled.length === 0 || previous === null) {
    return undefined;
  }

  const interval = Math.abs(current.fret - previous.fret);
  if (interval === 0 || noteIndex % 4 !== 3) {
    return undefined;
  }

  if (interval <= 2 && settings.techniques.hammerOns) {
    return "hammerOns";
  }

  if (interval <= 4 && settings.techniques.slides) {
    return "slides";
  }

  return settings.techniques.bends ? "bends" : undefined;
}

function generateLeadNotes(
  settings: GeneratorSettings,
  scalePositions: FretPosition[],
  measureGuideChords: ChordEvent[],
) {
  const stepsPerBeat = getStepsPerBeat(settings);
  const beatsPerMeasure = getBeatsPerMeasure(settings);
  const stepsPerMeasure = beatsPerMeasure * stepsPerBeat;
  const scaleNotes = buildScale(settings.tonic, settings.scale);
  const diatonicChords = buildDiatonicChords(settings);
  const tonicChord = diatonicChords[0];
  const fifth = scaleNotes[Math.min(4, scaleNotes.length - 1)];
  const stableRiffTargets = [settings.tonic, fifth, tonicChord?.notes[1] ?? settings.tonic];
  const notes: NoteEvent[] = [];
  let previous: FretPosition | null = null;
  let motifShape: MotifShape | null = null;

  for (let measureIndex = 0; measureIndex < settings.measures; measureIndex += 1) {
    const guideChord =
      measureGuideChords[Math.min(measureIndex, measureGuideChords.length - 1)] ?? tonicChord;
    const reuseMotif = motifShape !== null && measureIndex > 0 && Math.random() > 0.45;
    const rhythm = generateMeasureRhythm(
      settings,
      stepsPerMeasure,
      reuseMotif ? motifShape?.rhythm : undefined,
    );
    const targetPitchClasses =
      settings.mode === "riff"
        ? Array.from(new Set([...stableRiffTargets, ...guideChord.notes]))
        : Array.from(new Set([...guideChord.notes, settings.tonic]));
    const anchor = findCentralAnchor(scalePositions, targetPitchClasses, settings.mode);
    const relativeMidis: number[] = [];

    rhythm.forEach((hit, hitIndex) => {
      const isMeasureStart = hit.stepOffset === 0;
      const isPhraseEnding = hitIndex === rhythm.length - 1;
      const strongBeat = hit.stepOffset % stepsPerBeat === 0;
      const beatIndex = Math.floor(hit.stepOffset / stepsPerBeat);
      const localTargets = isPhraseEnding
        ? [settings.tonic, guideChord.notes[0], guideChord.notes[2]].filter(Boolean)
        : strongBeat
          ? guideChord.notes
          : targetPitchClasses;
      const motifMidiTarget =
        reuseMotif && motifShape && motifShape.relativeMidis[hitIndex] !== undefined
          ? anchor.midi + motifShape.relativeMidis[hitIndex]
          : undefined;
      const chosen = choosePosition(
        scalePositions,
        previous,
        anchor,
        localTargets,
        settings,
        isPhraseEnding,
        motifMidiTarget,
      );
      const durationBeats = hit.durationSteps / stepsPerBeat;
      const globalStep = measureIndex * stepsPerMeasure + hit.stepOffset;

      notes.push({
        id: `note-${measureIndex}-${hitIndex}`,
        pitchClass: chosen.pitchClass,
        midi: chosen.midi,
        frequency: chosen.frequency,
        stringIndex: chosen.stringIndex,
        fret: chosen.fret,
        stepIndex: globalStep,
        startBeat: measureIndex * beatsPerMeasure + beatIndex + (hit.stepOffset % stepsPerBeat) / stepsPerBeat,
        durationBeats,
        technique: attachTechnique(settings, notes.length, previous, chosen),
      });

      previous = chosen;
      relativeMidis.push(chosen.midi - anchor.midi);

      if (isMeasureStart && settings.mode === "melody" && Math.random() > 0.6) {
        previous = choosePosition(
          scalePositions,
          chosen,
          anchor,
          guideChord.notes,
          settings,
          false,
          chosen.midi + 2,
        );
      }
    });

    if (measureIndex === 0 || Math.random() > 0.7) {
      motifShape = { rhythm, relativeMidis };
    }
  }

  return notes;
}

export function generateOutput(settings: GeneratorSettings): GeneratedOutput {
  const scaleNotes = new Set(buildScale(settings.tonic, settings.scale));
  const positions = getPlayablePositions(
    settings.tuning,
    settings.lowestFret,
    settings.highestFret,
  )
    .filter((position) => scaleNotes.has(position.pitchClass))
    .sort((left, right) => left.midi - right.midi);
  const chords = settings.mode === "chord" ? generateChordProgression(settings) : [];
  const guideChords = settings.mode === "chord" ? chords : chooseMeasureGuideChords(settings);
  const notes =
    settings.mode === "chord" ? [] : generateLeadNotes(settings, positions, guideChords);
  const tab = buildTab(settings, notes, chords);
  const summary =
    settings.mode === "chord"
      ? `Forged ${chords.map((chord) => chord.name).join(" -> ")}.`
      : `Forged ${notes.length} notes with motif reuse, chord-tone targets, and a ${settings.mode} contour.`;

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
