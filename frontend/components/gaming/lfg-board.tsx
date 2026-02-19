"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Gamepad2, Plus, Users, Clock, Trash2 } from "lucide-react";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import type { LFGPost } from "@/types";

interface LFGBoardProps {
  guildId: string;
}

export function LFGBoard({ guildId }: LFGBoardProps) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<LFGPost[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [gameName, setGameName] = useState("");
  const [description, setDescription] = useState("");
  const [slots, setSlots] = useState(5);
  const [expiresIn, setExpiresIn] = useState(60);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api.get<LFGPost[]>(`/api/guilds/${guildId}/lfg`);
      setPosts(data);
    } catch {
      // handle error
    }
  }, [guildId]);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handleCreate = async () => {
    if (!gameName.trim()) return;
    setLoading(true);
    try {
      await api.post(`/api/guilds/${guildId}/lfg`, {
        game_name: gameName,
        description: description || undefined,
        slots_total: slots,
        expires_in_minutes: expiresIn,
      });
      setShowCreate(false);
      setGameName("");
      setDescription("");
      fetchPosts();
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (lfgId: string) => {
    try {
      await api.post(`/api/lfg/${lfgId}/join`);
      fetchPosts();
    } catch {
      // handle error
    }
  };

  const handleDelete = async (lfgId: string) => {
    try {
      await api.delete(`/api/lfg/${lfgId}`);
      fetchPosts();
    } catch {
      // handle error
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Looking for Group</h2>
          <Badge variant="secondary">{posts.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" /> Neuer Post
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="grid gap-3">
          {posts.map((post) => {
            const isFull = post.slots_filled >= post.slots_total;
            const isCreator = post.creator.id === user?.id;
            const isParticipant = post.participants.some((p) => p.id === user?.id);

            return (
              <div
                key={post.id}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  isFull ? "border-border bg-card/50 opacity-60" : "border-primary/20 bg-card glass"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.creator.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {getInitials(post.creator.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{post.game_name}</h3>
                      <p className="text-xs text-muted-foreground">von {post.creator.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isFull ? "secondary" : "default"}>
                      <Users className="mr-1 h-3 w-3" />
                      {post.slots_filled}/{post.slots_total}
                    </Badge>
                    {isCreator && (
                      <button onClick={() => handleDelete(post.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {post.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Laeuft ab {formatRelativeTime(post.expires_at)}
                  </div>
                  {!isCreator && !isParticipant && !isFull && (
                    <Button size="sm" variant="secondary" onClick={() => handleJoin(post.id)}>
                      Beitreten
                    </Button>
                  )}
                  {isParticipant && (
                    <Badge variant="outline" className="text-green-500 border-green-500/50">Beigetreten</Badge>
                  )}
                </div>

                {post.participants.length > 0 && (
                  <div className="mt-3 flex -space-x-2">
                    {post.participants.map((p) => (
                      <Avatar key={p.id} className="h-6 w-6 border-2 border-card">
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-secondary">{getInitials(p.username)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Gamepad2 className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p>Keine aktiven LFG-Posts</p>
              <p className="text-sm mt-1">Erstelle den ersten!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>LFG erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Spiel</Label>
              <Input value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="z.B. Valorant, LoL, CS2" className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ranked, Gold+, suchen Support..." className="bg-background/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plaetze gesamt</Label>
                <Input type="number" min={2} max={100} value={slots} onChange={(e) => setSlots(Number(e.target.value))} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Laeuft ab in (Min.)</Label>
                <Input type="number" min={5} max={1440} value={expiresIn} onChange={(e) => setExpiresIn(Number(e.target.value))} className="bg-background/50" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={loading || !gameName.trim()}>
              {loading ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
