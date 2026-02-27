import type { ChordEvent, NoteEvent } from "./types";

type SequencerPayload = {
  notes: NoteEvent[];
  chords: ChordEvent[];
  tempo: number;
  onPosition: (beat: number, active: NoteEvent | null) => void;
  onDone: () => void;
};

export class WebAudioSequencer {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private timers: number[] = [];

  private ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = 0.13;
      this.gainNode.connect(this.context.destination);
    }

    return { context: this.context, gainNode: this.gainNode! };
  }

  async start(payload: SequencerPayload) {
    this.stop();
    const { context, gainNode } = this.ensureContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    const secondsPerBeat = 60 / payload.tempo;

    payload.notes.forEach((note, noteIndex) => {
      const delay = note.startBeat * secondsPerBeat * 1000;
      const timer = window.setTimeout(() => {
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const envelope = context.createGain();

        oscillator.type = noteIndex % 2 === 0 ? "triangle" : "sawtooth";
        oscillator.frequency.value = note.frequency;
        envelope.gain.setValueAtTime(0.0001, now);
        envelope.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
        envelope.gain.exponentialRampToValueAtTime(
          0.0001,
          now + note.durationBeats * secondsPerBeat,
        );
        oscillator.connect(envelope);
        envelope.connect(gainNode);
        oscillator.start(now);
        oscillator.stop(now + note.durationBeats * secondsPerBeat + 0.05);
        payload.onPosition(note.startBeat, note);
      }, delay);

      this.timers.push(timer);
    });

    payload.chords.forEach((chord) => {
      const delay = chord.startBeat * secondsPerBeat * 1000;
      const timer = window.setTimeout(() => {
        payload.onPosition(chord.startBeat, null);
        chord.notes.forEach((_, index) => {
          const oscillator = context.createOscillator();
          const envelope = context.createGain();
          const frequency = 110 * 2 ** ((index + chord.degree) / 12);
          const now = context.currentTime;

          oscillator.type = "triangle";
          oscillator.frequency.value = frequency;
          envelope.gain.setValueAtTime(0.0001, now);
          envelope.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
          envelope.gain.exponentialRampToValueAtTime(
            0.0001,
            now + chord.durationBeats * secondsPerBeat,
          );
          oscillator.connect(envelope);
          envelope.connect(gainNode);
          oscillator.start(now);
          oscillator.stop(now + chord.durationBeats * secondsPerBeat + 0.04);
        });
      }, delay);

      this.timers.push(timer);
    });

    const endBeat = Math.max(
      0,
      ...payload.notes.map((note) => note.startBeat + note.durationBeats),
      ...payload.chords.map((chord) => chord.startBeat + chord.durationBeats),
    );

    const doneTimer = window.setTimeout(() => {
      payload.onPosition(endBeat, null);
      payload.onDone();
    }, endBeat * secondsPerBeat * 1000 + 120);

    this.timers.push(doneTimer);
  }

  stop() {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers = [];
  }
}
