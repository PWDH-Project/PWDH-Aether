import { create } from "zustand";
import { api } from "@/lib/api";
import type { Guild, Member } from "@/types";

interface ServerState {
  servers: Guild[];
  activeServer: Guild | null;
  members: Member[];

  fetchServers: () => Promise<void>;
  setActiveServer: (server: Guild | null) => void;
  fetchMembers: (guildId: string) => Promise<void>;
  createServer: (name: string) => Promise<Guild>;
  joinServer: (inviteCode: string) => Promise<Guild>;
  leaveServer: (guildId: string) => Promise<void>;
  deleteServer: (guildId: string) => Promise<void>;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  activeServer: null,
  members: [],

  fetchServers: async () => {
    const servers = await api.get<Guild[]>("/api/guilds");
    set({ servers });
  },

  setActiveServer: (server) => {
    set({ activeServer: server, members: [] });
  },

  fetchMembers: async (guildId) => {
    const members = await api.get<Member[]>(`/api/guilds/${guildId}/members`);
    set({ members });
  },

  createServer: async (name) => {
    const guild = await api.post<Guild>("/api/guilds", { name });
    set({ servers: [...get().servers, guild] });
    return guild;
  },

  joinServer: async (inviteCode) => {
    const guild = await api.post<Guild>("/api/guilds/join", { invite_code: inviteCode });
    set({ servers: [...get().servers, guild] });
    return guild;
  },

  leaveServer: async (guildId) => {
    await api.post(`/api/guilds/${guildId}/leave`);
    set({
      servers: get().servers.filter((s) => s.id !== guildId),
      activeServer: get().activeServer?.id === guildId ? null : get().activeServer,
    });
  },

  deleteServer: async (guildId) => {
    await api.delete(`/api/guilds/${guildId}`);
    set({
      servers: get().servers.filter((s) => s.id !== guildId),
      activeServer: get().activeServer?.id === guildId ? null : get().activeServer,
    });
  },
}));
