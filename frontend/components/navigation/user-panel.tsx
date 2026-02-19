"use client";

import { useAuthStore } from "@/store/use-auth-store";
import { useModalStore } from "@/store/use-modal-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Mic, Headphones } from "lucide-react";
import { getInitials } from "@/lib/utils";

export function UserPanel() {
  const { user, logout } = useAuthStore();
  const { open } = useModalStore();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-sidebar">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {getInitials(user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user.username}</p>
          <p className="text-[10px] text-muted-foreground truncate">Online</p>
        </div>
      </div>

      <div className="flex gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1.5 rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
              <Mic className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Mikrofon</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1.5 rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
              <Headphones className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Lautsprecher</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => open("userSettings")}
              className="p-1.5 rounded hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Einstellungen</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
