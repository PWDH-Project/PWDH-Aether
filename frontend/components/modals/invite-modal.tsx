"use client";

import { useState } from "react";
import { useModalStore } from "@/store/use-modal-store";
import { useThemeStore } from "@/store/use-theme-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export function InviteModal() {
  const { type, isOpen, close, data } = useModalStore();
  const { streamerMode } = useThemeStore();
  const [copied, setCopied] = useState(false);

  const open = type === "inviteModal" && isOpen;
  const inviteCode = data.server?.invite_code || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="glass border-border">
        <DialogHeader>
          <DialogTitle>Freunde einladen</DialogTitle>
          <DialogDescription>
            Teile diesen Einladungscode, damit andere deinem Server beitreten koennen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Einladungscode</Label>
            <div className="flex gap-2">
              <Input
                value={streamerMode ? "••••••••••" : inviteCode}
                readOnly
                className="bg-background/50 font-mono"
              />
              <Button size="icon" variant="secondary" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
