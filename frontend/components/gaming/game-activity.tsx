"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Gamepad2, Timer } from "lucide-react";
import { getInitials, formatGameTime } from "@/lib/utils";
import type { UserPresence } from "@/types";
import type { Member } from "@/types";

interface GameActivityProps {
  guildId: string;
  members: Member[];
}

export function GameActivity({ guildId, members }: GameActivityProps) {
  const { user } = useAuthStore();
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [showSetGame, setShowSetGame] = useState(false);
  const [gameName, setGameName] = useState("");
  const [customStatus, setCustomStatus] = useState("");

  const fetchPresences = useCallback(async () => {
    try {
      const data = await api.get<UserPresence[]>(`/api/guilds/${guildId}/presence`);
      setPresences(data);
    } catch {
      // handle error
    }
  }, [guildId]);

  useEffect(() => {
    fetchPresences();
    const interval = setInterval(fetchPresences, 15000);
    return () => clearInterval(interval);
  }, [fetchPresences]);

  const handleSetActivity = async () => {
    try {
      await api.patch("/api/presence", {
        status: "ONLINE",
        game_name: gameName || undefined,
        custom_status: customStatus || undefined,
      });
      setShowSetGame(false);
      fetchPresences();
    } catch {
      // handle error
    }
  };

  const handleClearActivity = async () => {
    try {
      await api.patch("/api/presence", {
        game_name: "",
        custom_status: "",
      });
      fetchPresences();
    } catch {
      // handle error
    }
  };

  const playingMembers = presences.filter((p) => p.game_name);
  const memberMap = new Map(members.map((m) => [m.user.id, m]));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Aktivitaet</h2>
          {playingMembers.length > 0 && (
            <Badge variant="secondary">{playingMembers.length} spielen</Badge>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowSetGame(true)}>
          Status setzen
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* My activity */}
        {presences.find((p) => p.user_id === user?.id)?.game_name && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-card glass p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Deine Aktivitaet</p>
                <p className="font-semibold text-primary mt-1">
                  {presences.find((p) => p.user_id === user?.id)?.game_name}
                </p>
                {presences.find((p) => p.user_id === user?.id)?.game_started_at && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Timer className="h-3 w-3" />
                    {formatGameTime(presences.find((p) => p.user_id === user?.id)!.game_started_at!)}
                  </div>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={handleClearActivity}>
                Beenden
              </Button>
            </div>
          </div>
        )}

        {/* Other members playing */}
        <div className="space-y-2">
          {playingMembers
            .filter((p) => p.user_id !== user?.id)
            .map((presence) => {
              const member = memberMap.get(presence.user_id);
              if (!member) return null;

              return (
                <div key={presence.user_id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/30">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-secondary">
                      {getInitials(member.user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{member.user.username}</p>
                    <p className="text-xs text-green-400 truncate">
                      Spielt {presence.game_name}
                    </p>
                  </div>
                  {presence.game_started_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatGameTime(presence.game_started_at)}
                    </span>
                  )}
                </div>
              );
            })}

          {playingMembers.filter((p) => p.user_id !== user?.id).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Niemand spielt gerade</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showSetGame} onOpenChange={setShowSetGame}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Aktivitaet setzen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Spiel / Aktivitaet</Label>
              <Input value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="z.B. Valorant, Minecraft" className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Custom Status (optional)</Label>
              <Input value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} placeholder="In der Ranked Queue..." className="bg-background/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSetGame(false)}>Abbrechen</Button>
            <Button onClick={handleSetActivity}>Setzen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
