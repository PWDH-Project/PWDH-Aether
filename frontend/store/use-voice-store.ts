import { create } from "zustand";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  LocalParticipant,
  RemoteTrackPublication,
  LocalTrackPublication,
  VideoPresets,
  type VideoCaptureOptions,
  type ScreenShareCaptureOptions,
  type VideoCodec,
} from "livekit-client";
import { api } from "@/lib/api";

export interface VoiceParticipant {
  identity: string;
  name: string;
  speaking: boolean;
  muted: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
}

export type MediaCodec = "vp8" | "vp9" | "av1" | "h264";

export interface MediaSettings {
  videoCodec: MediaCodec;
  screenShareCodec: MediaCodec;
  videoResolution: "720p" | "1080p" | "1440p" | "4k";
  videoBitrate: number;
  screenShareBitrate: number;
  screenShareFramerate: number;
}

const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
  videoCodec: "vp9",
  screenShareCodec: "vp9",
  videoResolution: "720p",
  videoBitrate: 1_500_000,
  screenShareBitrate: 3_000_000,
  screenShareFramerate: 30,
};

const RESOLUTION_MAP = {
  "720p": VideoPresets.h720,
  "1080p": VideoPresets.h1080,
  "1440p": VideoPresets.h1440,
  "4k": VideoPresets.h2160,
};

interface VoiceState {
  room: Room | null;
  channelId: string | null;
  serverId: string | null;
  joined: boolean;
  muted: boolean;
  deafened: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  participants: VoiceParticipant[];
  mediaSettings: MediaSettings;
  connecting: boolean;
  error: string | null;

  join: (serverId: string, channelId: string) => Promise<void>;
  leave: () => void;
  toggleMute: () => Promise<void>;
  toggleDeafen: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  updateMediaSettings: (settings: Partial<MediaSettings>) => void;
}

function buildParticipantList(room: Room): VoiceParticipant[] {
  const list: VoiceParticipant[] = [];

  const addParticipant = (p: LocalParticipant | RemoteParticipant) => {
    const audioTrack = p.getTrackPublications().find(
      (t) => t.source === Track.Source.Microphone
    );
    const videoTrack = p.getTrackPublications().find(
      (t) => t.source === Track.Source.Camera
    );
    const screenTrack = p.getTrackPublications().find(
      (t) => t.source === Track.Source.ScreenShare
    );

    list.push({
      identity: p.identity,
      name: p.name || p.identity,
      speaking: p.isSpeaking,
      muted: audioTrack ? audioTrack.isMuted : true,
      videoEnabled: !!videoTrack && !videoTrack.isMuted,
      screenSharing: !!screenTrack && !screenTrack.isMuted,
    });
  };

  addParticipant(room.localParticipant);
  room.remoteParticipants.forEach((p) => addParticipant(p));

  return list;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  room: null,
  channelId: null,
  serverId: null,
  joined: false,
  muted: false,
  deafened: false,
  videoEnabled: false,
  screenSharing: false,
  participants: [],
  mediaSettings: DEFAULT_MEDIA_SETTINGS,
  connecting: false,
  error: null,

  join: async (serverId, channelId) => {
    const current = get();
    if (current.room) {
      current.leave();
    }

    set({ connecting: true, error: null });

    try {
      const data = await api.get<{ token: string; url: string }>(
        `/api/channels/${channelId}/livekit-token`
      );

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      const refreshParticipants = () => {
        set({ participants: buildParticipantList(room) });
      };

      room.on(RoomEvent.ParticipantConnected, refreshParticipants);
      room.on(RoomEvent.ParticipantDisconnected, refreshParticipants);
      room.on(RoomEvent.TrackSubscribed, refreshParticipants);
      room.on(RoomEvent.TrackUnsubscribed, refreshParticipants);
      room.on(RoomEvent.TrackMuted, refreshParticipants);
      room.on(RoomEvent.TrackUnmuted, refreshParticipants);
      room.on(RoomEvent.ActiveSpeakersChanged, refreshParticipants);
      room.on(RoomEvent.LocalTrackPublished, refreshParticipants);
      room.on(RoomEvent.LocalTrackUnpublished, refreshParticipants);

      room.on(RoomEvent.Disconnected, () => {
        set({
          room: null,
          channelId: null,
          serverId: null,
          joined: false,
          muted: false,
          deafened: false,
          videoEnabled: false,
          screenSharing: false,
          participants: [],
          connecting: false,
        });
      });

      let livekitUrl = data.url;
      if (livekitUrl.startsWith("http://")) {
        livekitUrl = livekitUrl.replace("http://", "ws://");
      } else if (livekitUrl.startsWith("https://")) {
        livekitUrl = livekitUrl.replace("https://", "wss://");
      }

      await room.connect(livekitUrl, data.token);

      await room.localParticipant.setMicrophoneEnabled(true);

      set({
        room,
        channelId,
        serverId,
        joined: true,
        muted: false,
        connecting: false,
        participants: buildParticipantList(room),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verbindung fehlgeschlagen";
      set({ connecting: false, error: message });
    }
  },

  leave: () => {
    const { room } = get();
    if (room) {
      room.disconnect();
    }
    set({
      room: null,
      channelId: null,
      serverId: null,
      joined: false,
      muted: false,
      deafened: false,
      videoEnabled: false,
      screenSharing: false,
      participants: [],
      connecting: false,
      error: null,
    });
  },

  toggleMute: async () => {
    const { room, muted } = get();
    if (!room) return;

    const newMuted = !muted;
    await room.localParticipant.setMicrophoneEnabled(!newMuted);
    set({ muted: newMuted, participants: buildParticipantList(room) });
  },

  toggleDeafen: async () => {
    const { room, deafened } = get();
    if (!room) return;

    const newDeafened = !deafened;
    room.remoteParticipants.forEach((p) => {
      p.audioTrackPublications.forEach((pub) => {
        if (pub.track) {
          if (newDeafened) {
            pub.track.detach();
          } else {
            pub.track.attach();
          }
        }
      });
    });

    if (newDeafened) {
      await room.localParticipant.setMicrophoneEnabled(false);
      set({ deafened: true, muted: true });
    } else {
      set({ deafened: false });
    }
  },

  toggleVideo: async () => {
    const { room, videoEnabled, mediaSettings } = get();
    if (!room) return;

    const newEnabled = !videoEnabled;
    const opts: VideoCaptureOptions = {
      resolution: RESOLUTION_MAP[mediaSettings.videoResolution].resolution,
    };

    await room.localParticipant.setCameraEnabled(newEnabled, opts);
    set({ videoEnabled: newEnabled, participants: buildParticipantList(room) });
  },

  toggleScreenShare: async () => {
    const { room, screenSharing, mediaSettings } = get();
    if (!room) return;

    const newSharing = !screenSharing;

    if (newSharing) {
      const opts: ScreenShareCaptureOptions = {
        resolution: { width: 1920, height: 1080, frameRate: mediaSettings.screenShareFramerate },
        audio: true,
      };
      await room.localParticipant.setScreenShareEnabled(true, opts);
    } else {
      await room.localParticipant.setScreenShareEnabled(false);
    }

    set({ screenSharing: newSharing, participants: buildParticipantList(room) });
  },

  updateMediaSettings: (settings) => {
    set((state) => ({
      mediaSettings: { ...state.mediaSettings, ...settings },
    }));
  },
}));
