"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/store/use-modal-store";
import { useChannelStore } from "@/store/use-channel-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Hash, Volume2, Video } from "lucide-react";

export function CreateChannelModal() {
  const router = useRouter();
  const { type, isOpen, close, data } = useModalStore();
  const { createChannel } = useChannelStore();
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState("TEXT");
  const [loading, setLoading] = useState(false);

  const open = type === "createChannel" && isOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !data.server) return;
    setLoading(true);
    try {
      const channel = await createChannel(data.server.id, name.trim().toLowerCase().replace(/\s+/g, "-"), channelType);
      close();
      setName("");
      setChannelType("TEXT");
      if (channel.type === "TEXT") {
        router.push(`/channels/${data.server.id}/${channel.id}`);
      }
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
          <DialogTitle>Kanal erstellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kanaltyp</Label>
              <Select value={channelType} onValueChange={setChannelType}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" /> Text
                    </div>
                  </SelectItem>
                  <SelectItem value="VOICE">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" /> Sprache
                    </div>
                  </SelectItem>
                  <SelectItem value="VIDEO">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" /> Video
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kanalname</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="neuer-kanal"
                className="bg-background/50"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
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
