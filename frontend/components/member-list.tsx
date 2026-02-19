"use client";

import { useServerStore } from "@/store/use-server-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";
import type { Member } from "@/types";

const roleOrder = ["OWNER", "ADMIN", "MODERATOR", "MEMBER"];
const roleLabels: Record<string, string> = {
  OWNER: "Eigentuemer",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  MEMBER: "Mitglied",
};

function groupByRole(members: Member[]) {
  const groups: Record<string, Member[]> = {};
  for (const m of members) {
    if (!groups[m.role]) groups[m.role] = [];
    groups[m.role].push(m);
  }
  return roleOrder
    .filter((r) => groups[r]?.length)
    .map((r) => ({ role: r, label: roleLabels[r], members: groups[r] }));
}

export function MemberList() {
  const { members } = useServerStore();

  const groups = groupByRole(members);

  return (
    <div className="hidden lg:flex h-full w-60 flex-col border-l border-border bg-card">
      <ScrollArea className="flex-1 px-2 py-4">
        {groups.map((group) => (
          <div key={group.role} className="mb-4">
            <p className="px-2 mb-1 text-xs font-semibold uppercase text-muted-foreground tracking-wide">
              {group.label} — {group.members.length}
            </p>
            {group.members.map((member) => (
              <div
                key={member.user.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-secondary">
                      {getInitials(member.user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                      member.status === "ONLINE" ? "bg-green-500" :
                      member.status === "IDLE" ? "bg-yellow-500" :
                      member.status === "DND" ? "bg-red-500" :
                      "bg-gray-500"
                    )}
                  />
                </div>
                <span className="text-sm truncate">{member.user.username}</span>
                {member.role === "OWNER" && (
                  <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 h-4 border-yellow-500/50 text-yellow-500">
                    ♛
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
