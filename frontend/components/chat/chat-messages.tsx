"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useSocketStore } from "@/store/use-socket-store";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { ChatItem } from "./chat-item";
import { Loader2 } from "lucide-react";
import type { Message } from "@/types";

interface ChatMessagesProps {
  channelId: string;
}

export function ChatMessages({ channelId }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { subscribe, unsubscribe, on } = useSocketStore();
  const { ref, scrollToBottom } = useChatScroll([messages.length]);
  const typingUsers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [typingNames, setTypingNames] = useState<string[]>([]);

  const fetchMessages = useCallback(async (before?: string) => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (before) params.set("before", before);
      const data = await api.get<Message[]>(`/api/channels/${channelId}/messages?${params}`);
      return data;
    } catch {
      return [];
    }
  }, [channelId]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setHasMore(true);

    fetchMessages().then((data) => {
      setMessages(data);
      setLoading(false);
      setHasMore(data.length >= 50);
      setTimeout(scrollToBottom, 50);
    });

    subscribe(channelId);
    return () => unsubscribe(channelId);
  }, [channelId, fetchMessages, subscribe, unsubscribe, scrollToBottom]);

  useEffect(() => {
    const unsubs = [
      on("MESSAGE_CREATE", (data) => {
        const msg = data as Message;
        if (msg.channel_id === channelId) {
          setMessages((prev) => [...prev, msg]);
        }
      }),
      on("MESSAGE_UPDATE", (data) => {
        const msg = data as Message;
        if (msg.channel_id === channelId) {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
        }
      }),
      on("MESSAGE_DELETE", (data) => {
        const { id, channel_id } = data as { id: string; channel_id: string };
        if (channel_id === channelId) {
          setMessages((prev) => prev.filter((m) => m.id !== id));
        }
      }),
      on("TYPING_START", (data) => {
        const { user_id, channel_id } = data as { user_id: string; channel_id: string };
        if (channel_id !== channelId) return;

        const existing = typingUsers.current.get(user_id);
        if (existing) clearTimeout(existing);

        const timeout = setTimeout(() => {
          typingUsers.current.delete(user_id);
          setTypingNames(Array.from(typingUsers.current.keys()));
        }, 3000);

        typingUsers.current.set(user_id, timeout);
        setTypingNames(Array.from(typingUsers.current.keys()));
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [channelId, on]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[0];
    const data = await fetchMessages(oldest.created_at);
    setMessages((prev) => [...data, ...prev]);
    setHasMore(data.length >= 50);
    setLoadingMore(false);
  };

  const handleScroll = () => {
    if (ref.current && ref.current.scrollTop < 100 && hasMore && !loadingMore) {
      handleLoadMore();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={ref} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4">
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!hasMore && messages.length > 0 && (
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold">Willkommen im Kanal!</h3>
            <p className="text-sm text-muted-foreground">Das ist der Anfang der Konversation.</p>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center h-full">
            <p className="text-muted-foreground">Noch keine Nachrichten. Schreib die erste!</p>
          </div>
        )}

        <div className="space-y-0.5">
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showHeader = !prev ||
              prev.user.id !== msg.user.id ||
              new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 300000;

            return (
              <ChatItem
                key={msg.id}
                message={msg}
                showHeader={showHeader}
              />
            );
          })}
        </div>
      </div>

      {typingNames.length > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground">
          <span className="animate-pulse">
            {typingNames.length === 1
              ? "Jemand schreibt..."
              : `${typingNames.length} Personen schreiben...`}
          </span>
        </div>
      )}
    </div>
  );
}
