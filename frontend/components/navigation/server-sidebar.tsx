"use client";

import { useRouter, useParams } from "next/navigation";
import { useServerStore } from "@/store/use-server-store";
import { useModalStore } from "@/store/use-modal-store";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Compass } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

export function ServerSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeServerId = params.serverId as string | undefined;
  const { servers } = useServerStore();
  const { open } = useModalStore();

  return (
    <div className="flex h-full w-[72px] flex-col items-center bg-sidebar py-3 gap-2">
      {/* Home / DM Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => router.push("/channels")}
            className={cn(
              "group flex h-12 w-12 items-center justify-center rounded-[24px] transition-all duration-200 hover:rounded-[16px]",
              !activeServerId
                ? "rounded-[16px] bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <span className="text-lg font-bold">A</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Startseite</TooltipContent>
      </Tooltip>

      <Separator className="mx-auto w-8" />

      {/* Server list */}
      <ScrollArea className="flex-1 w-full">
        <div className="flex flex-col items-center gap-2">
          {servers.map((server) => (
            <Tooltip key={server.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push(`/channels/${server.id}`)}
                  className={cn(
                    "group relative flex h-12 w-12 items-center justify-center rounded-[24px] transition-all duration-200 hover:rounded-[16px]",
                    activeServerId === server.id
                      ? "rounded-[16px] bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {server.icon_url ? (
                    <img
                      src={server.icon_url}
                      alt={server.name}
                      className="h-full w-full rounded-[inherit] object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold">
                      {getInitials(server.name)}
                    </span>
                  )}
                  {/* Active indicator */}
                  <div
                    className={cn(
                      "absolute -left-[4px] w-1 rounded-r-full bg-foreground transition-all",
                      activeServerId === server.id
                        ? "h-10"
                        : "h-0 group-hover:h-5"
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{server.name}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </ScrollArea>

      <Separator className="mx-auto w-8" />

      {/* Action buttons */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => open("createServer")}
            className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-secondary text-green-500 transition-all duration-200 hover:rounded-[16px] hover:bg-green-500 hover:text-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Server erstellen</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => open("joinServer")}
            className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-secondary text-green-500 transition-all duration-200 hover:rounded-[16px] hover:bg-green-500 hover:text-white"
          >
            <Compass className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Server beitreten</TooltipContent>
      </Tooltip>
    </div>
  );
}
