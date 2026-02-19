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

export function CreateServerModal() {
  const router = useRouter();
  const { type, isOpen, close } = useModalStore();
  const { createServer } = useServerStore();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const open = type === "createServer" && isOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const guild = await createServer(name.trim());
      close();
      setName("");
      router.push(`/channels/${guild.id}`);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="glass border-border">
        <DialogHeader>
          <DialogTitle>Server erstellen</DialogTitle>
          <DialogDescription>
            Gib deinem Server einen Namen. Du kannst ihn spaeter aendern.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Servername</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mein Gaming Server"
                className="bg-background/50"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
