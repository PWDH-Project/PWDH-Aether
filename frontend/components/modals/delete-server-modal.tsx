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

export function DeleteServerModal() {
  const router = useRouter();
  const { type, isOpen, close, data } = useModalStore();
  const { deleteServer } = useServerStore();
  const [loading, setLoading] = useState(false);

  const open = type === "deleteServer" && isOpen;

  const handleDelete = async () => {
    if (!data.server) return;
    setLoading(true);
    try {
      await deleteServer(data.server.id);
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
          <DialogTitle>Server loeschen</DialogTitle>
          <DialogDescription>
            Bist du sicher, dass du <strong>{data.server?.name}</strong> loeschen moechtest?
            Diese Aktion kann nicht rueckgaengig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={loading}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Wird geloescht..." : "Server loeschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
