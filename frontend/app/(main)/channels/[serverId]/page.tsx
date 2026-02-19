"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChannelStore } from "@/store/use-channel-store";

export default function ServerHome() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.serverId as string;
  const { channels } = useChannelStore();

  useEffect(() => {
    const textChannel = channels.find((c) => c.type === "TEXT");
    if (textChannel) {
      router.replace(`/channels/${serverId}/${textChannel.id}`);
    }
  }, [channels, serverId, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">
        Waehle einen Kanal aus der Seitenleiste
      </p>
    </div>
  );
}
