"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/store/use-modal-store";
import { useServerStore } from "@/store/use-server-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function JoinServerModal() {
  const router = useRouter();
  const { type, isOpen, close } = useModalStore();
  const { joinServer } = useServerStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = type === "joinServer" && isOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const guild = await joinServer(code.trim());
      close();
      setCode("");
      router.push(`/channels/${guild.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beitritt fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="glass border-border">
        <DialogHeader>
          <DialogTitle>Server beitreten</DialogTitle>
          <DialogDescription>
            Gib einen Einladungscode ein, um einem Server beizutreten.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Einladungscode</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="abc123def4"
                className="bg-background/50"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !code.trim()}>
              {loading ? "Wird beigetreten..." : "Beitreten"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
