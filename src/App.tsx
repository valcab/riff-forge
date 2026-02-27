import { useEffect, useMemo, useRef, useState } from "react";
import { ControlsPanel } from "@/components/ControlsPanel";
import { Fretboard } from "@/components/Fretboard";
import { OutputTabs } from "@/components/OutputTabs";
import { PlaybackBar } from "@/components/PlaybackBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateOutput } from "@/music/generators";
import { WebAudioSequencer } from "@/music/sequencer";
import { TUNINGS } from "@/music/tuning";
import type { GeneratedOutput, GeneratorSettings, NoteEvent } from "@/music/types";

const PRESET_KEY = "riff-forge-preset";

const DEFAULT_SETTINGS: GeneratorSettings = {
  mode: "riff",
  tonic: "E",
  scale: "pentatonicMinor",
  tempo: 120,
  timeSignature: "4/4",
  measures: 2,
  density: 48,
  lowestFret: 0,
  highestFret: 12,
  tuning: TUNINGS[0],
  techniques: {
    bends: true,
    slides: true,
    hammerOns: true,
  },
  chordCount: 4,
  allowBorrowedChords: false,
};

const DEFAULT_OUTPUT = generateOutput(DEFAULT_SETTINGS);

const STATUS_LINES = [
  "Heating the virtual tubes.",
  "Sharpening pick attack.",
  "Teaching the riff gremlins new tricks.",
  "Polishing suspiciously heroic power chords.",
];

function readPreset() {
  try {
    const stored = localStorage.getItem(PRESET_KEY);
    return stored ? (JSON.parse(stored) as GeneratorSettings) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [settings, setSettings] = useState<GeneratorSettings>(DEFAULT_SETTINGS);
  const [output, setOutput] = useState<GeneratedOutput>(DEFAULT_OUTPUT);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [activeNote, setActiveNote] = useState<NoteEvent | null>(null);
  const [trail, setTrail] = useState<NoteEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusLine, setStatusLine] = useState(STATUS_LINES[0]);
  const sequencerRef = useRef(new WebAudioSequencer());

  useEffect(() => {
    const preset = readPreset();
    if (preset) {
      setSettings(preset);
      setOutput(generateOutput(preset));
    }
  }, []);

  useEffect(() => {
    const sequencer = sequencerRef.current;
    return () => {
      sequencer.stop();
    };
  }, []);

  const statCards = useMemo(
    () => [
      { label: "Events", value: output.notes.length.toString().padStart(2, "0") },
      { label: "Chords", value: output.chords.length.toString().padStart(2, "0") },
      { label: "Tuning", value: settings.tuning.isCustom ? "Custom" : settings.tuning.name.split(" ")[0] },
    ],
    [output.chords.length, output.notes.length, settings.tuning],
  );

  function handleGenerate(nextSettings = settings) {
    const generated = generateOutput(nextSettings);
    setOutput(generated);
    setCurrentBeat(0);
    setActiveNote(null);
    setTrail([]);
    setStatusLine(STATUS_LINES[Math.floor(Math.random() * STATUS_LINES.length)]);
  }

  function handleRandomize() {
    const randomSettings: GeneratorSettings = {
      ...settings,
      mode: (["riff", "melody", "chord"] as const)[Math.floor(Math.random() * 3)],
      tonic: ["C", "D", "E", "F", "G", "A", "B"][Math.floor(Math.random() * 7)],
      tempo: 90 + Math.floor(Math.random() * 70),
      density: 20 + Math.floor(Math.random() * 75),
      measures: 1 + Math.floor(Math.random() * 4),
      chordCount: 3 + Math.floor(Math.random() * 3),
      allowBorrowedChords: Math.random() > 0.55,
    };

    setSettings(randomSettings);
    handleGenerate(randomSettings);
  }

  async function handlePlay() {
    setIsPlaying(true);
    await sequencerRef.current.start({
      notes: output.notes,
      chords: output.chords,
      tempo: settings.tempo,
      onPosition: (beat, note) => {
        setCurrentBeat(beat);
        setActiveNote(note);
        if (note) {
          setTrail((previous) => [note, ...previous].slice(0, 6));
        }
      },
      onDone: () => {
        setIsPlaying(false);
        setActiveNote(null);
      },
    });
  }

  function handleStop() {
    sequencerRef.current.stop();
    setIsPlaying(false);
    setActiveNote(null);
    setCurrentBeat(0);
  }

  function handleSavePreset() {
    localStorage.setItem(PRESET_KEY, JSON.stringify(settings));
    setStatusLine("Preset sealed in localStorage.");
  }

  function handleLoadPreset() {
    const preset = readPreset();
    if (!preset) {
      setStatusLine("No preset found. Forge one and save it first.");
      return;
    }

    setSettings(preset);
    handleGenerate(preset);
    setStatusLine("Preset loaded. The forge remembers.");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.18),_transparent_28%),linear-gradient(140deg,_#120f0d,_#1c1921_38%,_#0d1720)] px-4 py-8 text-foreground">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <ControlsPanel
          settings={settings}
          onChange={setSettings}
          onGenerate={() => handleGenerate()}
          onPlay={() => void handlePlay()}
          onStop={handleStop}
          onRandomize={handleRandomize}
          onSavePreset={handleSavePreset}
          onLoadPreset={handleLoadPreset}
          isPlaying={isPlaying}
          statusLine={statusLine}
        />

        <section className="space-y-6">
          <Card className="overflow-hidden border-primary/20">
            <CardHeader className="border-b border-border/40 bg-black/20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle className="text-3xl">Riff Forge</CardTitle>
                  <CardDescription className="max-w-2xl">
                    Guitar riff, melody, and progression generator with theory-aware
                    constraints, animated fretboard playback, and quick preset recall.
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  {statCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-[1.25rem] border border-border/50 bg-background/60 px-4 py-3"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="font-display text-xl">{card.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <PlaybackBar
                currentBeat={currentBeat}
                timeSignature={settings.timeSignature}
                measures={settings.measures}
                isPlaying={isPlaying}
              />
              <Fretboard
                tuning={settings.tuning}
                lowestFret={settings.lowestFret}
                highestFret={settings.highestFret}
                activeNote={activeNote}
                trail={trail}
              />
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <OutputTabs notes={output.notes} chords={output.chords} tab={output.tab} />
                <Card className="bg-background/60">
                  <CardHeader>
                    <CardTitle className="text-lg">How it feels</CardTitle>
                    <CardDescription>{output.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-sm text-muted-foreground">
                      Audio starts on user gesture and quantizes to the selected BPM and
                      meter. Generated notes stay inside the chosen scale and fret span.
                    </p>
                    <Button variant="outline" onClick={() => handleGenerate()}>
                      Regenerate phrase
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
