"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useServerStore } from "@/store/use-server-store";
import { useChannelStore } from "@/store/use-channel-store";
import { useModalStore } from "@/store/use-modal-store";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Hash, Volume2, Video, Settings, Plus, LogOut, Gamepad2, Music, Activity } from "lucide-react";

const channelIcons = {
  TEXT: Hash,
  VOICE: Volume2,
  VIDEO: Video,
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { servers, activeServer } = useServerStore();
  const { channels } = useChannelStore();
  const { open: openModal } = useModalStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Suche nach Kanaelen, Servern, Aktionen..." />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

        {activeServer && channels.length > 0 && (
          <CommandGroup heading="Kanaele">
            {channels.map((ch) => {
              const Icon = channelIcons[ch.type] || Hash;
              return (
                <CommandItem
                  key={ch.id}
                  onSelect={() =>
                    handleSelect(() =>
                      router.push(`/channels/${activeServer.id}/${ch.id}`)
                    )
                  }
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {ch.name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Server">
          {servers.map((server) => (
            <CommandItem
              key={server.id}
              onSelect={() =>
                handleSelect(() => router.push(`/channels/${server.id}`))
              }
            >
              <span className="mr-2 text-xs font-bold">
                {server.name.slice(0, 2).toUpperCase()}
              </span>
              {server.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {activeServer && (
          <CommandGroup heading="Gaming">
            <CommandItem onSelect={() => handleSelect(() => router.push(`/channels/${activeServer.id}/lfg`))}>
              <Gamepad2 className="mr-2 h-4 w-4" />
              LFG Board
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => router.push(`/channels/${activeServer.id}/soundboard`))}>
              <Music className="mr-2 h-4 w-4" />
              Soundboard
            </CommandItem>
            <CommandItem onSelect={() => handleSelect(() => router.push(`/channels/${activeServer.id}/activity`))}>
              <Activity className="mr-2 h-4 w-4" />
              Aktivitaet
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Aktionen">
          <CommandItem onSelect={() => handleSelect(() => openModal("createServer"))}>
            <Plus className="mr-2 h-4 w-4" />
            Server erstellen
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => openModal("joinServer"))}>
            <Plus className="mr-2 h-4 w-4" />
            Server beitreten
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => openModal("userSettings"))}>
            <Settings className="mr-2 h-4 w-4" />
            Einstellungen
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
