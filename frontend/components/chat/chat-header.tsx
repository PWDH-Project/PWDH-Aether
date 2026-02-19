"use client";

import type { Channel } from "@/types";
import { Hash, Volume2, Video, Users } from "lucide-react";

const icons = {
  TEXT: Hash,
  VOICE: Volume2,
  VIDEO: Video,
};

export function ChatHeader({ channel }: { channel: Channel }) {
  const Icon = icons[channel.type] || Hash;

  return (
    <div className="flex h-12 items-center gap-2 border-b border-border px-4 shrink-0">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <h2 className="font-semibold">{channel.name}</h2>
      <div className="flex-1" />
      <button className="p-1.5 rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
        <Users className="h-5 w-5" />
      </button>
    </div>
  );
}
