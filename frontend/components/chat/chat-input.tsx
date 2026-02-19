"use client";

import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useSocketStore } from "@/store/use-socket-store";
import { Plus, Send, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  channelId: string;
}

export function ChatInput({ channelId }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendTyping } = useSocketStore();
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (typingTimeout.current) return;
    sendTyping(channelId);
    typingTimeout.current = setTimeout(() => {
      typingTimeout.current = null;
    }, 2000);
  }, [channelId, sendTyping]);

  const handleSubmit = async () => {
    if ((!content.trim() && !file) || sending) return;
    setSending(true);

    try {
      let attachmentUrl: string | undefined;

      if (file) {
        setUploading(true);
        const result = await api.upload(file);
        attachmentUrl = result.url;
        setUploading(false);
      }

      await api.post(`/api/channels/${channelId}/messages`, {
        content: content.trim() || (file ? `📎 ${file.name}` : ""),
        attachment_url: attachmentUrl,
      });

      setContent("");
      setFile(null);
      textareaRef.current?.focus();
    } catch {
      // handle error
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 8 * 1024 * 1024) {
        alert("Datei zu gross (max. 8MB)");
        return;
      }
      setFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (dropped.size > 8 * 1024 * 1024) {
        alert("Datei zu gross (max. 8MB)");
        return;
      }
      setFile(dropped);
    }
  };

  return (
    <div className="px-4 pb-4">
      {file && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-secondary/50 border border-border px-3 py-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm truncate flex-1">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        className="flex items-end gap-2 rounded-xl bg-secondary/50 border border-border px-3 py-2"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".jpg,.jpeg,.png,.gif,.webp,.mp3,.ogg,.wav,.mp4,.webm,.txt,.pdf,.zip"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="Nachricht schreiben..."
          className="flex-1 bg-transparent text-sm resize-none outline-none max-h-[150px] placeholder:text-muted-foreground"
          rows={1}
        />

        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && !file) || sending}
          className={cn(
            "shrink-0 p-1.5 rounded-full transition-all",
            content.trim() || file
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "text-muted-foreground"
          )}
        >
          {uploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
