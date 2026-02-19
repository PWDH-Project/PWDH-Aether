"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Volume2, Plus, Trash2, Play, Square } from "lucide-react";
import type { SoundboardClip } from "@/types";

interface SoundboardProps {
  guildId: string;
}

export function Soundboard({ guildId }: SoundboardProps) {
  const [clips, setClips] = useState<SoundboardClip[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchClips = useCallback(async () => {
    try {
      const data = await api.get<SoundboardClip[]>(`/api/guilds/${guildId}/soundboard`);
      setClips(data);
    } catch {
      // handle error
    }
  }, [guildId]);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const handleUpload = async () => {
    if (!name.trim() || !file) return;
    setLoading(true);
    try {
      const { url } = await api.upload(file);
      await api.post(`/api/guilds/${guildId}/soundboard`, { name, file_url: url });
      setShowUpload(false);
      setName("");
      setFile(null);
      fetchClips();
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (clip: SoundboardClip) => {
    if (playingId === clip.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(clip.file_url);
    audioRef.current = audio;
    setPlayingId(clip.id);

    audio.play();
    audio.onended = () => setPlayingId(null);
  };

  const handleDelete = async (clipId: string) => {
    try {
      await api.delete(`/api/soundboard/${clipId}`);
      fetchClips();
    } catch {
      // handle error
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Soundboard</h2>
        </div>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Plus className="mr-1 h-4 w-4" /> Hinzufuegen
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {clips.map((clip) => (
            <button
              key={clip.id}
              onClick={() => handlePlay(clip)}
              className="group relative flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-card/80 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {playingId === clip.id ? (
                  <Square className="h-5 w-5 text-primary animate-pulse" />
                ) : (
                  <Play className="h-5 w-5 text-primary" />
                )}
              </div>
              <span className="text-sm font-medium truncate w-full text-center">{clip.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(clip.id);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </button>
          ))}

          {clips.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Volume2 className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p>Kein Soundboard-Clip vorhanden</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Sound hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Airhorn" className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Audio-Datei</Label>
              <Input
                type="file"
                accept=".mp3,.ogg,.wav"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUpload(false)}>Abbrechen</Button>
            <Button onClick={handleUpload} disabled={loading || !name.trim() || !file}>
              {loading ? "Wird hochgeladen..." : "Hochladen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
