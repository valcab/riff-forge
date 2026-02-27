import { Card, CardContent } from "@/components/ui/card";

type PlaybackBarProps = {
  currentBeat: number;
  timeSignature: string;
  measures: number;
  isPlaying: boolean;
};

export function PlaybackBar({
  currentBeat,
  timeSignature,
  measures,
  isPlaying,
}: PlaybackBarProps) {
  const beatsPerMeasure = timeSignature === "6/8" ? 6 : Number(timeSignature[0]);
  const totalBeats = beatsPerMeasure * measures;
  const progress = totalBeats === 0 ? 0 : Math.min(100, (currentBeat / totalBeats) * 100);
  const bar = Math.floor(currentBeat / beatsPerMeasure) + 1;
  const beat = (Math.floor(currentBeat) % beatsPerMeasure) + 1;

  return (
    <Card className="border-primary/20 bg-background/60">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Playback</p>
            <p className="font-mono text-base">
              {isPlaying ? `Bar ${bar} : Beat ${beat}` : "Ready to forge"}
            </p>
          </div>
          <p className="rounded-full bg-secondary px-3 py-1 font-mono text-xs uppercase tracking-[0.2em]">
            {timeSignature}
          </p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
