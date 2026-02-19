"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVoiceStore, type MediaCodec } from "@/store/use-voice-store";
import { Monitor, Video, Gauge } from "lucide-react";

interface MediaSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CODECS: { value: MediaCodec; label: string; description: string }[] = [
  { value: "vp8", label: "VP8", description: "Breiteste Kompatibilitaet, geringste Qualitaet" },
  { value: "vp9", label: "VP9", description: "Gute Balance aus Qualitaet und Kompatibilitaet" },
  { value: "av1", label: "AV1", description: "Beste Qualitaet, hoher CPU-Verbrauch" },
  { value: "h264", label: "H.264", description: "Hardware-Beschleunigung auf den meisten Geraeten" },
];

const RESOLUTIONS = [
  { value: "720p", label: "720p (HD)" },
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "1440p", label: "1440p (2K)" },
  { value: "4k", label: "2160p (4K)" },
];

function formatBitrate(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  return `${(bps / 1_000).toFixed(0)} kbps`;
}

export function MediaSettingsDialog({ open, onOpenChange }: MediaSettingsDialogProps) {
  const { mediaSettings, updateMediaSettings } = useVoiceStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Medien-Einstellungen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Video Settings */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Video className="h-4 w-4" />
              Kamera / Video
            </h4>

            <div className="space-y-2 pl-6">
              <Label>Video-Codec</Label>
              <Select
                value={mediaSettings.videoCodec}
                onValueChange={(v) => updateMediaSettings({ videoCodec: v as MediaCodec })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODECS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div>
                        <span className="font-medium">{c.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{c.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pl-6">
              <Label>Aufloesung</Label>
              <Select
                value={mediaSettings.videoResolution}
                onValueChange={(v) => updateMediaSettings({ videoResolution: v as "720p" | "1080p" | "1440p" | "4k" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <Label>Video-Bitrate</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatBitrate(mediaSettings.videoBitrate)}
                </span>
              </div>
              <Slider
                value={[mediaSettings.videoBitrate]}
                onValueChange={([v]) => updateMediaSettings({ videoBitrate: v })}
                min={300_000}
                max={8_000_000}
                step={100_000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>300 kbps</span>
                <span>8 Mbps</span>
              </div>
            </div>
          </div>

          {/* Screen Share Settings */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Monitor className="h-4 w-4" />
              Bildschirm teilen
            </h4>

            <div className="space-y-2 pl-6">
              <Label>Screenshare-Codec</Label>
              <Select
                value={mediaSettings.screenShareCodec}
                onValueChange={(v) => updateMediaSettings({ screenShareCodec: v as MediaCodec })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODECS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div>
                        <span className="font-medium">{c.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{c.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <Label>Screenshare-Bitrate</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatBitrate(mediaSettings.screenShareBitrate)}
                </span>
              </div>
              <Slider
                value={[mediaSettings.screenShareBitrate]}
                onValueChange={([v]) => updateMediaSettings({ screenShareBitrate: v })}
                min={500_000}
                max={15_000_000}
                step={500_000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>500 kbps</span>
                <span>15 Mbps</span>
              </div>
            </div>

            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <Label>Bildrate (FPS)</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {mediaSettings.screenShareFramerate} FPS
                </span>
              </div>
              <Slider
                value={[mediaSettings.screenShareFramerate]}
                onValueChange={([v]) => updateMediaSettings({ screenShareFramerate: v })}
                min={5}
                max={60}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 FPS</span>
                <span>60 FPS</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
