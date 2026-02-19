"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useServerStore } from "@/store/use-server-store";
import { useChannelStore } from "@/store/use-channel-store";
import { useSocketStore } from "@/store/use-socket-store";
import { ChannelSidebar } from "@/components/navigation/channel-sidebar";
import { MemberList } from "@/components/member-list";

export default function ServerLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const serverId = params.serverId as string;
  const { servers, setActiveServer, fetchMembers } = useServerStore();
  const { fetchChannels } = useChannelStore();
  const { subscribeGuild } = useSocketStore();

  useEffect(() => {
    const server = servers.find((s) => s.id === serverId);
    if (server) {
      setActiveServer(server);
      fetchChannels(serverId);
      fetchMembers(serverId);
      subscribeGuild(serverId);
    }
  }, [serverId, servers, setActiveServer, fetchChannels, fetchMembers, subscribeGuild]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <ChannelSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
      <MemberList />
    </div>
  );
}
