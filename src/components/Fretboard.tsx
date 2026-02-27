import { cn } from "@/lib/utils";
import type { NoteEvent, Tuning } from "@/music/types";

type FretboardProps = {
  tuning: Tuning;
  lowestFret: number;
  highestFret: number;
  activeNote: NoteEvent | null;
  trail: NoteEvent[];
};

export function Fretboard({
  tuning,
  lowestFret,
  highestFret,
  activeNote,
  trail,
}: FretboardProps) {
  const frets = Array.from(
    { length: highestFret - lowestFret + 1 },
    (_, index) => lowestFret + index,
  );

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-border/60 bg-stone-950/90 p-4">
      <div className="min-w-[720px]">
        <div className="mb-3 grid" style={{ gridTemplateColumns: `80px repeat(${frets.length}, minmax(0, 1fr))` }}>
          <div />
          {frets.map((fret) => (
            <div key={fret} className="text-center font-mono text-xs text-stone-400">
              {fret}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[...tuning.strings].reverse().map((stringNote, rowIndex) => {
            const stringIndex = tuning.strings.length - rowIndex - 1;
            return (
              <div
                key={stringNote + rowIndex}
                className="grid items-center gap-2"
                style={{
                  gridTemplateColumns: `80px repeat(${frets.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="font-mono text-sm text-stone-300">{stringNote}</div>
                {frets.map((fret) => {
                  const isActive =
                    activeNote?.stringIndex === stringIndex && activeNote.fret === fret;
                  const isTrail = trail.some(
                    (note) => note.stringIndex === stringIndex && note.fret === fret,
                  );

                  return (
                    <div
                      key={`${stringIndex}-${fret}`}
                      className="relative flex h-10 items-center"
                    >
                      <div className="h-[2px] w-full bg-stone-500" />
                      <div
                        className={cn(
                          "absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-400/30 bg-stone-900/80 transition-all",
                          isTrail && "bg-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
                          isActive &&
                            "animate-pulse-grid border-amber-300 bg-amber-300 text-black shadow-[0_0_24px_rgba(252,211,77,0.65)]",
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
