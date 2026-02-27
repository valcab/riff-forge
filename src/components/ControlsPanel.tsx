import { Music2, Shuffle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SCALE_DEFINITIONS, TONICS } from "@/music/scales";
import { TUNINGS } from "@/music/tuning";
import type { GeneratorSettings, Mode, Tuning } from "@/music/types";

type ControlsPanelProps = {
  settings: GeneratorSettings;
  onChange: (next: GeneratorSettings) => void;
  onGenerate: () => void;
  onPlay: () => void;
  onStop: () => void;
  onRandomize: () => void;
  onSavePreset: () => void;
  onLoadPreset: () => void;
  isPlaying: boolean;
  statusLine: string;
};

function updateSettings(
  settings: GeneratorSettings,
  onChange: ControlsPanelProps["onChange"],
  patch: Partial<GeneratorSettings>,
) {
  onChange({ ...settings, ...patch });
}

export function ControlsPanel({
  settings,
  onChange,
  onGenerate,
  onPlay,
  onStop,
  onRandomize,
  onSavePreset,
  onLoadPreset,
  isPlaying,
  statusLine,
}: ControlsPanelProps) {
  const customTuning = settings.tuning.isCustom;

  return (
    <TooltipProvider delayDuration={100}>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-amber-300/20 via-background to-teal-300/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Forge Controls</CardTitle>
              <CardDescription>
                Dial in the theory, then punch out a playable phrase.
              </CardDescription>
            </div>
            <div className="rounded-full border border-primary/30 bg-primary/10 p-3 text-primary">
              <Music2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-background/70 px-4 py-3 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{statusLine}</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["riff", "Riff"],
                  ["melody", "Melody"],
                  ["chord", "Chord Progression"],
                ].map(([value, label]) => (
                  <Button
                    key={value}
                    variant={settings.mode === value ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      updateSettings(settings, onChange, { mode: value as Mode })
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tonic</Label>
              <Select
                value={settings.tonic}
                onValueChange={(tonic) => updateSettings(settings, onChange, { tonic })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tonic" />
                </SelectTrigger>
                <SelectContent>
                  {TONICS.map((tonic) => (
                    <SelectItem key={tonic} value={tonic}>
                      {tonic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Scale</Label>
              <Select
                value={settings.scale}
                onValueChange={(scale) =>
                  updateSettings(settings, onChange, {
                    scale: scale as GeneratorSettings["scale"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scale" />
                </SelectTrigger>
                <SelectContent>
                  {SCALE_DEFINITIONS.map((scale) => (
                    <SelectItem key={scale.id} value={scale.id}>
                      {scale.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tempo: {settings.tempo} BPM</Label>
              <Slider
                value={[settings.tempo]}
                min={70}
                max={180}
                step={1}
                onValueChange={([tempo]) => updateSettings(settings, onChange, { tempo })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rhythm Complexity: {settings.density}</Label>
              <Slider
                value={[settings.density]}
                min={10}
                max={100}
                step={1}
                onValueChange={([density]) =>
                  updateSettings(settings, onChange, { density })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Time Signature</Label>
              <Select
                value={settings.timeSignature}
                onValueChange={(timeSignature) =>
                  updateSettings(settings, onChange, {
                    timeSignature: timeSignature as GeneratorSettings["timeSignature"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["4/4", "3/4", "6/8"].map((signature) => (
                    <SelectItem key={signature} value={signature}>
                      {signature}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Measures</Label>
              <Input
                min={1}
                max={8}
                type="number"
                value={settings.measures}
                onChange={(event) =>
                  updateSettings(settings, onChange, {
                    measures: Number(event.target.value),
                  })
                }
              />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Lowest Fret</Label>
              <Input
                min={0}
                max={20}
                type="number"
                value={settings.lowestFret}
                onChange={(event) =>
                  updateSettings(settings, onChange, {
                    lowestFret: Number(event.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Highest Fret</Label>
              <Input
                min={settings.lowestFret}
                max={24}
                type="number"
                value={settings.highestFret}
                onChange={(event) =>
                  updateSettings(settings, onChange, {
                    highestFret: Number(event.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tuning</Label>
              <Select
                value={customTuning ? "custom" : settings.tuning.name}
                onValueChange={(value) => {
                  if (value === "custom") {
                    updateSettings(settings, onChange, {
                      tuning: { ...settings.tuning, isCustom: true },
                    });
                    return;
                  }

                  const tuning = TUNINGS.find((item) => item.name === value);
                  if (tuning) {
                    updateSettings(settings, onChange, { tuning });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TUNINGS.map((tuning) => (
                    <SelectItem key={tuning.name} value={tuning.name}>
                      {tuning.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(customTuning ? settings.tuning.strings : []).map((note, index) => (
              <div key={`${note}-${index}`} className="space-y-2">
                <Label>String {index + 1}</Label>
                <Input
                  value={note}
                  onChange={(event) => {
                    const strings = [...settings.tuning.strings];
                    strings[index] = event.target.value.toUpperCase();
                    updateSettings(settings, onChange, {
                      tuning: { name: "Custom Tuning", strings, isCustom: true } as Tuning,
                    });
                  }}
                />
              </div>
            ))}
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <ToggleRow
              label="Allow bends"
              checked={settings.techniques.bends}
              onCheckedChange={(bends) =>
                updateSettings(settings, onChange, {
                  techniques: { ...settings.techniques, bends },
                })
              }
            />
            <ToggleRow
              label="Allow slides"
              checked={settings.techniques.slides}
              onCheckedChange={(slides) =>
                updateSettings(settings, onChange, {
                  techniques: { ...settings.techniques, slides },
                })
              }
            />
            <ToggleRow
              label="Allow hammer-ons"
              checked={settings.techniques.hammerOns}
              onCheckedChange={(hammerOns) =>
                updateSettings(settings, onChange, {
                  techniques: { ...settings.techniques, hammerOns },
                })
              }
            />
            <ToggleRow
              label="Borrowed chords"
              checked={settings.allowBorrowedChords}
              onCheckedChange={(allowBorrowedChords) =>
                updateSettings(settings, onChange, { allowBorrowedChords })
              }
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Chord Count</Label>
              <Input
                min={2}
                max={8}
                type="number"
                value={settings.chordCount}
                onChange={(event) =>
                  updateSettings(settings, onChange, {
                    chordCount: Number(event.target.value),
                  })
                }
              />
            </div>
          </section>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Button onClick={onGenerate}>
              <Sparkles className="h-4 w-4" />
              Generate
            </Button>
            <Button variant="secondary" onClick={onPlay}>
              Play
            </Button>
            <Button variant="outline" onClick={onStop} disabled={!isPlaying}>
              Stop
            </Button>
            <Button variant="outline" onClick={onRandomize}>
              <Shuffle className="h-4 w-4" />
              Randomize
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={onSavePreset}>
                  Save Preset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Saves the current settings to localStorage.</TooltipContent>
            </Tooltip>
            <Button variant="outline" onClick={onLoadPreset}>
              Load Preset
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function ToggleRow({ label, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
