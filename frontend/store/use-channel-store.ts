import { create } from "zustand";
import { api } from "@/lib/api";
import type { Channel } from "@/types";

interface ChannelState {
  channels: Channel[];
  activeChannel: Channel | null;

  fetchChannels: (guildId: string) => Promise<void>;
  setActiveChannel: (channel: Channel | null) => void;
  createChannel: (guildId: string, name: string, type: string, category?: string) => Promise<Channel>;
  deleteChannel: (channelId: string) => Promise<void>;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  activeChannel: null,

  fetchChannels: async (guildId) => {
    const channels = await api.get<Channel[]>(`/api/guilds/${guildId}/channels`);
    set({ channels });
  },

  setActiveChannel: (channel) => {
    set({ activeChannel: channel });
  },

  createChannel: async (guildId, name, type, category) => {
    const channel = await api.post<Channel>(`/api/guilds/${guildId}/channels`, {
      name,
      type,
      category,
    });
    set({ channels: [...get().channels, channel] });
    return channel;
  },

  deleteChannel: async (channelId) => {
    await api.delete(`/api/channels/${channelId}`);
    set({
      channels: get().channels.filter((c) => c.id !== channelId),
      activeChannel: get().activeChannel?.id === channelId ? null : get().activeChannel,
    });
  },
}));
