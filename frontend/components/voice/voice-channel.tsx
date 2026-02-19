"use client";

import { useEffect, useRef, useCallback } from "react";
import { useVoiceStore, type VoiceParticipant } from "@/store/use-voice-store";
import { useParams } from "next/navigation";
import type { Channel } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Mic,
  MicOff,
  Headphones,
  HeadphoneOff,
  Monitor,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  Settings2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { MediaSettingsDialog } from "./media-settings-dialog";
import { useState } from "react";

interface VoiceChannelProps {
  channel: Channel;
}

function ParticipantTile({ participant, isLocal }: { participant: VoiceParticipant; isLocal: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { room } = useVoiceStore();

  useEffect(() => {
    if (!room || !videoRef.current) return;

    let trackPublication;
    if (isLocal) {
      trackPublication = Array.from(room.localParticipant.videoTrackPublications.values()).find(
        (pub) => pub.source === "camera"
      );
    } else {
      const remote = room.remoteParticipants.get(participant.identity);
      trackPublication = remote
        ? Array.from(remote.videoTrackPublications.values()).find((pub) => pub.source === "camera")
        : undefined;
    }

    if (trackPublication?.track) {
      trackPublication.track.attach(videoRef.current);
      return () => {
        trackPublication?.track?.detach(videoRef.current!);
      };
    }
  }, [room, participant.identity, participant.videoEnabled, isLocal]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl bg-card border border-border overflow-hidden transition-all",
        participant.speaking && "ring-2 ring-green-500/70 shadow-[0_0_15px_rgba(34,197,94,0.3)]",
        participant.videoEnabled ? "aspect-video" : "p-6"
      )}
    >
      {participant.videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <Avatar className="h-20 w-20 mb-2">
          <AvatarFallback className="text-2xl bg-primary/20 text-primary">
            {getInitials(participant.name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-sm font-medium text-white truncate">
          {participant.name} {isLocal && "(Du)"}
        </span>
        <div className="flex items-center gap-1.5">
          {participant.muted && <MicOff className="h-3.5 w-3.5 text-red-400" />}
          {participant.screenSharing && <Monitor className="h-3.5 w-3.5 text-blue-400" />}
        </div>
      </div>
    </div>
  );
}

function ScreenShareView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { room, participants } = useVoiceStore();

  const screensharer = participants.find((p) => p.screenSharing);

  useEffect(() => {
    if (!room || !videoRef.current || !screensharer) return;

    const isLocal = room.localParticipant.identity === screensharer.identity;
    let trackPub;

    if (isLocal) {
      trackPub = Array.from(room.localParticipant.videoTrackPublications.values()).find(
        (pub) => pub.source === "screen_share"
      );
    } else {
      const remote = room.remoteParticipants.get(screensharer.identity);
      trackPub = remote
        ? Array.from(remote.videoTrackPublications.values()).find((pub) => pub.source === "screen_share")
        : undefined;
    }

    if (trackPub?.track) {
      trackPub.track.attach(videoRef.current);
      return () => {
        trackPub?.track?.detach(videoRef.current!);
      };
    }
  }, [room, screensharer]);

  if (!screensharer) return null;

  return (
    <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden border border-border bg-black mb-4">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
      <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 text-xs text-white flex items-center gap-1.5">
        <Monitor className="h-3.5 w-3.5 text-blue-400" />
        {screensharer.name} teilt den Bildschirm
      </div>
    </div>
  );
}

export function VoiceChannel({ channel }: VoiceChannelProps) {
  const params = useParams();
  const serverId = params.serverId as string;

  const {
    joined,
    muted,
    deafened,
    videoEnabled,
    screenSharing,
    participants,
    connecting,
    error,
    join,
    leave,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    toggleScreenShare,
    channelId: activeChannelId,
  } = useVoiceStore();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const isInThisChannel = joined && activeChannelId === channel.id;
  const hasScreenShare = participants.some((p) => p.screenSharing);

  const handleJoin = useCallback(async () => {
    await join(serverId, channel.id);
  }, [join, serverId, channel.id]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-12 items-center gap-2 border-b border-border px-4 shrink-0">
        <Volume2 className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">{channel.name}</h2>
        <span className="text-xs text-muted-foreground ml-auto">
          {channel.type === "VIDEO" ? "Video-Kanal" : "Sprachkanal"}
        </span>
        {isInThisChannel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Medien-Einstellungen</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center p-8 overflow-auto">
        {!isInThisChannel ? (
          <div className="text-center space-y-6">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Volume2 className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{channel.name}</h3>
              <p className="text-muted-foreground mt-1">
                {channel.type === "VIDEO" ? "Video-Kanal" : "Sprachkanal"}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button onClick={handleJoin} size="lg" className="glow" disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verbinden...
                </>
              ) : (
                channel.type === "VIDEO" ? "Video beitreten" : "Sprache beitreten"
              )}
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-5xl">
            {hasScreenShare && <ScreenShareView />}

            <div className={cn(
              "grid gap-4",
              hasScreenShare
                ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            )}>
              {participants.map((p) => (
                <ParticipantTile
                  key={p.identity}
                  participant={p}
                  isLocal={p.identity === useVoiceStore.getState().room?.localParticipant.identity}
                />
              ))}
            </div>

            {participants.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Verbunden. Warte auf andere Teilnehmer...
              </div>
            )}
          </div>
        )}
      </div>

      {isInThisChannel && (
        <div className="flex items-center justify-center gap-2 border-t border-border py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleMute}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                  muted ? "bg-destructive/20 text-destructive" : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{muted ? "Mikrofon aktivieren" : "Stummschalten"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleDeafen}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                  deafened ? "bg-destructive/20 text-destructive" : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {deafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{deafened ? "Audio aktivieren" : "Taubschalten"}</TooltipContent>
          </Tooltip>

          {channel.type === "VIDEO" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleVideo}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    videoEnabled ? "bg-primary/20 text-primary" : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{videoEnabled ? "Kamera deaktivieren" : "Kamera aktivieren"}</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleScreenShare}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                  screenSharing ? "bg-primary/20 text-primary" : "bg-secondary hover:bg-secondary/80"
                )}
              >
                <Monitor className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{screenSharing ? "Bildschirm-Uebertragung beenden" : "Bildschirm teilen"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Settings2 className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Medien-Einstellungen</TooltipContent>
          </Tooltip>

          <div className="w-4" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={leave}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Verlassen</TooltipContent>
          </Tooltip>
        </div>
      )}

      <MediaSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
