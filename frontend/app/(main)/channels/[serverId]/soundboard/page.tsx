"use client";

import { useParams } from "next/navigation";
import { Soundboard } from "@/components/gaming/soundboard";

export default function SoundboardPage() {
  const params = useParams();
  const serverId = params.serverId as string;

  return <Soundboard guildId={serverId} />;
}
