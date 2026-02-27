# Riff Forge

Riff Forge is a playful single-page web app for generating guitar riffs, melodies, and chord progressions with music theory controls, animated fretboard playback, and quick preset recall.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui-style component setup with Radix primitives
- Web Audio API for synth playback

## Features

- Generator panel for mode, tonic, scale, tempo, meter, measures, complexity, fret range, tuning, and chord settings
- Standard tuning, Drop D, and editable custom tuning
- Techniques metadata toggles for bends, slides, and hammer-ons
- Animated six-string fretboard with active note highlight and recent note trail
- Playback transport with bar/beat progress
- Output views for event list, ASCII tab, and chord cards
- Preset save/load via `localStorage`
- Production build ready with `npm run build`

## How It Works

The music engine lives under `src/music`:

- `scales.ts` builds pitch collections from tonic + interval formulas.
- `fretboard.ts` maps tuning and fret ranges to playable note positions.
- `generators.ts` creates riffs and melodies from scale-safe fretboard positions, using simple rhythmic subdivision and motif repetition.
- `chords.ts` creates diatonic triads and basic borrowed-chord variants, plus simple suggested shapes.
- `sequencer.ts` schedules playback with the Web Audio API and updates the UI playback position.

The UI lives under `src/components`:

- `ControlsPanel.tsx` exposes generator and preset controls.
- `Fretboard.tsx` renders the animated guitar neck.
- `PlaybackBar.tsx` shows progress and bar/beat position.
- `OutputTabs.tsx` shows event, tab, and chord output views.

## Local Development

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## Screenshot Notes

To capture screenshots for documentation:

1. Run `npm run dev`.
2. Generate a phrase or progression.
3. Capture the controls panel, animated fretboard, and output tabs.

