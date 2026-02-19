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
import { Button } from "@/components/ui/button";

export function LeaveServerModal() {
  const router = useRouter();
  const { type, isOpen, close, data } = useModalStore();
  const { leaveServer } = useServerStore();
  const [loading, setLoading] = useState(false);

  const open = type === "leaveServer" && isOpen;

  const handleLeave = async () => {
    if (!data.server) return;
    setLoading(true);
    try {
      await leaveServer(data.server.id);
      close();
      router.push("/channels");
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
          <DialogTitle>Server verlassen</DialogTitle>
          <DialogDescription>
            Bist du sicher, dass du <strong>{data.server?.name}</strong> verlassen moechtest?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={loading}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={loading}>
            {loading ? "Wird verlassen..." : "Verlassen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
