"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2, SmilePlus } from "lucide-react";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types";

interface ChatItemProps {
  message: Message;
  showHeader: boolean;
}

export function ChatItem({ message, showHeader }: ChatItemProps) {
  const { user: currentUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [hovering, setHovering] = useState(false);

  const isOwn = currentUser?.id === message.user.id;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setEditing(false);
      return;
    }
    try {
      await api.patch(`/api/messages/${message.id}`, { content: editContent });
      setEditing(false);
    } catch {
      // handle error
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/messages/${message.id}`);
    } catch {
      // handle error
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      await api.post(`/api/messages/${message.id}/reactions`, { emoji });
    } catch {
      // handle error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === "Escape") {
      setEditing(false);
      setEditContent(message.content);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 py-0.5 px-2 -mx-2 rounded message-enter",
        showHeader ? "mt-3 pt-1" : "",
        hovering && "bg-secondary/30"
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {showHeader ? (
        <Avatar className="h-9 w-9 mt-0.5 shrink-0">
          <AvatarImage src={message.user.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/20 text-primary">
            {getInitials(message.user.username)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-9 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm hover:underline cursor-pointer">
              {message.user.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(message.created_at)}
            </span>
          </div>
        )}

        {editing ? (
          <div className="flex gap-2 mt-1">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background/50 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Abbrechen
            </Button>
          </div>
        ) : (
          <div className="text-sm leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <pre className="my-2 rounded-md bg-background/80 p-3 overflow-x-auto">
                        <code className="text-xs font-mono">{children}</code>
                      </pre>
                    );
                  }
                  return (
                    <code className="rounded bg-background/80 px-1.5 py-0.5 text-xs font-mono text-primary">
                      {children}
                    </code>
                  );
                },
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.updated_at && (
              <span className="text-[10px] text-muted-foreground ml-1">(bearbeitet)</span>
            )}
          </div>
        )}

        {message.attachment_url && (
          <div className="mt-2">
            {message.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={message.attachment_url}
                alt="Anhang"
                className="max-w-md max-h-80 rounded-lg object-cover"
              />
            ) : (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm hover:underline"
              >
                Datei herunterladen
              </a>
            )}
          </div>
        )}

        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  r.me
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-secondary/50 hover:bg-secondary"
                )}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons on hover */}
      {hovering && !editing && (
        <div className="absolute -top-3 right-2 flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleReaction("👍")}
                className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <SmilePlus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Reaktion</TooltipContent>
          </Tooltip>
          {isOwn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setEditing(true);
                    setEditContent(message.content);
                  }}
                  className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Bearbeiten</TooltipContent>
            </Tooltip>
          )}
          {isOwn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDelete}
                  className="rounded p-1 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Loeschen</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
