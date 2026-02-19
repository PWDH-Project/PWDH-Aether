"use client";

import { useParams } from "next/navigation";
import { useServerStore } from "@/store/use-server-store";
import { GameActivity } from "@/components/gaming/game-activity";

export default function ActivityPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const { members } = useServerStore();

  return <GameActivity guildId={serverId} members={members} />;
}
