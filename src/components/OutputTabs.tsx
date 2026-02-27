import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChordEvent, NoteEvent } from "@/music/types";

type OutputTabsProps = {
  notes: NoteEvent[];
  chords: ChordEvent[];
  tab: string[];
};

export function OutputTabs({ notes, chords, tab }: OutputTabsProps) {
  return (
    <Tabs defaultValue="events">
      <TabsList>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="tab">Tab</TabsTrigger>
        <TabsTrigger value="chords">Chords</TabsTrigger>
      </TabsList>
      <TabsContent value="events">
        <div className="max-h-[320px] overflow-auto rounded-[1.25rem] border border-border/60 bg-background/60 p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th>Step</th>
                <th>Pitch</th>
                <th>String</th>
                <th>Fret</th>
                <th>Beat</th>
              </tr>
            </thead>
            <tbody>
              {notes.slice(0, 64).map((note) => (
                <tr key={note.id} className="border-t border-border/40">
                  <td className="py-2">{note.stepIndex}</td>
                  <td>{note.pitchClass}</td>
                  <td>{note.stringIndex + 1}</td>
                  <td>{note.fret}</td>
                  <td>{note.startBeat.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
      <TabsContent value="tab">
        <pre className="overflow-auto rounded-[1.25rem] border border-border/60 bg-stone-950 p-4 font-mono text-xs text-stone-200">
          {tab.join("\n")}
        </pre>
      </TabsContent>
      <TabsContent value="chords">
        <div className="grid gap-3 md:grid-cols-2">
          {chords.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Generate chord progression mode to populate this panel.
            </div>
          ) : (
            chords.map((chord) => (
              <div
                key={chord.id}
                className="rounded-[1.25rem] border border-border/60 bg-background/60 p-4"
              >
                <p className="font-display text-lg">{chord.name}</p>
                <p className="text-sm text-muted-foreground">
                  Notes: {chord.notes.join(" - ")}
                </p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  Shape:{" "}
                  {chord.suggestedShape
                    .map((shape) => `S${shape.stringIndex + 1}:${shape.fret}`)
                    .join("  ")}
                </p>
              </div>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
