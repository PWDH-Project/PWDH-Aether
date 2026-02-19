import { create } from "zustand";
import { api } from "@/lib/api";
import type { WSEvent } from "@/types";

type EventHandler = (data: unknown) => void;

interface SocketState {
  ws: WebSocket | null;
  connected: boolean;
  handlers: Map<string, Set<EventHandler>>;

  connect: () => void;
  disconnect: () => void;
  subscribe: (channelId: string) => void;
  unsubscribe: (channelId: string) => void;
  subscribeGuild: (guildId: string) => void;
  sendTyping: (channelId: string) => void;
  on: (event: string, handler: EventHandler) => () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  ws: null,
  connected: false,
  handlers: new Map(),

  connect: () => {
    const existing = get().ws;
    if (existing && existing.readyState === WebSocket.OPEN) return;

    const wsUrl = api.getWsUrl();
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      set({ connected: true });
    };

    ws.onmessage = (ev) => {
      try {
        const event: WSEvent = JSON.parse(ev.data);
        const handlers = get().handlers.get(event.t);
        if (handlers) {
          handlers.forEach((h) => h(event.d));
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      set({ connected: false, ws: null });
      setTimeout(() => {
        if (api.getToken()) {
          get().connect();
        }
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    set({ ws });
  },

  disconnect: () => {
    const ws = get().ws;
    if (ws) {
      ws.close();
      set({ ws: null, connected: false });
    }
  },

  subscribe: (channelId) => {
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: "SUBSCRIBE", d: { channel_id: channelId } }));
    }
  },

  unsubscribe: (channelId) => {
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: "UNSUBSCRIBE", d: { channel_id: channelId } }));
    }
  },

  subscribeGuild: (guildId) => {
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: "SUBSCRIBE_GUILD", d: { guild_id: guildId } }));
    }
  },

  sendTyping: (channelId) => {
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: "TYPING", d: { channel_id: channelId } }));
    }
  },

  on: (event, handler) => {
    const { handlers } = get();
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)!.add(handler);
    set({ handlers: new Map(handlers) });

    return () => {
      const current = get().handlers;
      current.get(event)?.delete(handler);
      set({ handlers: new Map(current) });
    };
  },
}));
