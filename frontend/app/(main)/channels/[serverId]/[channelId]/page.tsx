"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useChannelStore } from "@/store/use-channel-store";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { VoiceChannel } from "@/components/voice/voice-channel";

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  const { channels, setActiveChannel } = useChannelStore();

  const channel = channels.find((c) => c.id === channelId);

  useEffect(() => {
    if (channel) {
      setActiveChannel(channel);
    }
    return () => setActiveChannel(null);
  }, [channel, setActiveChannel]);

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Kanal nicht gefunden</p>
      </div>
    );
  }

  if (channel.type === "VOICE" || channel.type === "VIDEO") {
    return <VoiceChannel channel={channel} />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader channel={channel} />
      <ChatMessages channelId={channelId} />
      <ChatInput channelId={channelId} />
    </div>
  );
}
