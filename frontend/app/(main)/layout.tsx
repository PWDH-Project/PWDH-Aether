"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useSocketStore } from "@/store/use-socket-store";
import { useServerStore } from "@/store/use-server-store";
import { ServerSidebar } from "@/components/navigation/server-sidebar";
import { CommandPalette } from "@/components/command-palette";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const { fetchServers } = useServerStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
      fetchServers();
      return () => disconnect();
    }
  }, [isAuthenticated, connect, disconnect, fetchServers]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse-glow h-12 w-12 rounded-full bg-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <ServerSidebar />
      {children}
      <CommandPalette />
    </div>
  );
}
