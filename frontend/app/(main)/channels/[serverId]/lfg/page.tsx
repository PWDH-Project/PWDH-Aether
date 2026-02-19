"use client";

import { useParams } from "next/navigation";
import { LFGBoard } from "@/components/gaming/lfg-board";

export default function LFGPage() {
  const params = useParams();
  const serverId = params.serverId as string;

  return <LFGBoard guildId={serverId} />;
}
