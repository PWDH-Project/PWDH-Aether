"use client";

import { useRouter, useParams } from "next/navigation";
import { useServerStore } from "@/store/use-server-store";
import { useChannelStore } from "@/store/use-channel-store";
import { useModalStore } from "@/store/use-modal-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useVoiceStore } from "@/store/use-voice-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Hash, Volume2, Video, Plus, Settings, ChevronDown, UserPlus, Trash2, LogOut, Gamepad2, Music, Activity, MicOff, PhoneOff } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { UserPanel } from "./user-panel";

const channelIcons = {
  TEXT: Hash,
  VOICE: Volume2,
  VIDEO: Video,
};

export function ChannelSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeChannelId = params.channelId as string | undefined;
  const serverId = params.serverId as string;

  const { activeServer } = useServerStore();
  const { channels } = useChannelStore();
  const { open } = useModalStore();
  const { user } = useAuthStore();
  const {
    joined: voiceJoined,
    channelId: voiceChannelId,
    serverId: voiceServerId,
    participants: voiceParticipants,
    muted: voiceMuted,
    leave: voiceLeave,
  } = useVoiceStore();

  const isOwner = activeServer?.owner_id === user?.id;

  const categories = channels.reduce<Record<string, typeof channels>>((acc, ch) => {
    const cat = ch.category || "Allgemein";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ch);
    return acc;
  }, {});

  if (!activeServer) return null;

  const isVoiceChannel = (type: string) => type === "VOICE" || type === "VIDEO";
  const isConnectedToChannel = (channelId: string) =>
    voiceJoined && voiceChannelId === channelId && voiceServerId === serverId;

  return (
    <div className="flex h-full w-60 flex-col bg-card border-r border-border">
      {/* Server header */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-12 items-center justify-between px-4 border-b border-border hover:bg-secondary/50 transition-colors outline-none">
          <span className="font-semibold truncate">{activeServer.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem onClick={() => open("inviteModal", { server: activeServer })}>
            <UserPlus className="mr-2 h-4 w-4" />
            Leute einladen
          </DropdownMenuItem>
          {isOwner && (
            <>
              <DropdownMenuItem onClick={() => open("serverSettings", { server: activeServer })}>
                <Settings className="mr-2 h-4 w-4" />
                Server-Einstellungen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => open("createChannel", { server: activeServer })}>
                <Plus className="mr-2 h-4 w-4" />
                Kanal erstellen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => open("deleteServer", { server: activeServer })}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Server loeschen
              </DropdownMenuItem>
            </>
          )}
          {!isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => open("leaveServer", { server: activeServer })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Server verlassen
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Channels */}
      <ScrollArea className="flex-1 px-2">
        <div className="py-2">
          {/* Gaming Features */}
          <div className="mb-3">
            <span className="px-1 text-xs font-semibold uppercase text-muted-foreground tracking-wide">
              Gaming
            </span>
            <div className="mt-1 space-y-0.5">
              <button
                onClick={() => router.push(`/channels/${serverId}/lfg`)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
              >
                <Gamepad2 className="h-4 w-4 shrink-0" />
                <span>LFG Board</span>
              </button>
              <button
                onClick={() => router.push(`/channels/${serverId}/soundboard`)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
              >
                <Music className="h-4 w-4 shrink-0" />
                <span>Soundboard</span>
              </button>
              <button
                onClick={() => router.push(`/channels/${serverId}/activity`)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
              >
                <Activity className="h-4 w-4 shrink-0" />
                <span>Aktivitaet</span>
              </button>
            </div>
          </div>

          {Object.entries(categories).map(([category, categoryChannels]) => (
            <div key={category} className="mb-2">
              <div className="flex items-center justify-between px-1 py-1">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  {category}
                </span>
                {isOwner && (
                  <button
                    onClick={() => open("createChannel", { server: activeServer })}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {categoryChannels.map((channel) => {
                const Icon = channelIcons[channel.type] || Hash;
                const isVoice = isVoiceChannel(channel.type);
                const isConnected = isConnectedToChannel(channel.id);

                return (
                  <div key={channel.id}>
                    <button
                      onClick={() => router.push(`/channels/${serverId}/${channel.id}`)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        activeChannelId === channel.id
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isConnected && "text-green-500")} />
                      <span className="truncate">{channel.name}</span>
                    </button>

                    {/* Voice participants list */}
                    {isVoice && isConnected && voiceParticipants.length > 0 && (
                      <div className="ml-6 mt-0.5 mb-1 space-y-0.5">
                        {voiceParticipants.map((p) => (
                          <div
                            key={p.identity}
                            className="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
                          >
                            <div className={cn(
                              "relative",
                              p.speaking && "ring-1 ring-green-500 rounded-full"
                            )}>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                                  {getInitials(p.name)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <span className="truncate text-muted-foreground">{p.name}</span>
                            {p.muted && <MicOff className="h-3 w-3 text-muted-foreground/60 shrink-0 ml-auto" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Voice connection bar */}
      {voiceJoined && voiceServerId === serverId && (
        <div className="border-t border-border px-3 py-2 bg-green-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-green-500 truncate">Sprachverbindung</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {channels.find((c) => c.id === voiceChannelId)?.name || "Verbunden"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {voiceMuted && <MicOff className="h-3.5 w-3.5 text-destructive" />}
              <button
                onClick={voiceLeave}
                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              >
                <PhoneOff className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Separator />
      <UserPanel />
    </div>
  );
}
