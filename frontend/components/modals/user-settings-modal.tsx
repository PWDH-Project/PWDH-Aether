"use client";

import { useModalStore } from "@/store/use-modal-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useThemeStore, ACCENT_COLORS, type AccentKey } from "@/store/use-theme-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LogOut, Eye } from "lucide-react";

export function UserSettingsModal() {
  const { type, isOpen, close } = useModalStore();
  const { user, logout } = useAuthStore();
  const { accent, streamerMode, setAccent, toggleStreamerMode } = useThemeStore();

  const open = type === "userSettings" && isOpen;

  const handleLogout = () => {
    logout();
    close();
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="glass border-border max-w-lg">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance">Aussehen</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6 mt-4">
            {/* Accent color picker */}
            <div className="space-y-3">
              <Label>Akzentfarbe</Label>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(ACCENT_COLORS) as [AccentKey, typeof ACCENT_COLORS[AccentKey]][]).map(
                  ([key, color]) => (
                    <button
                      key={key}
                      onClick={() => setAccent(key)}
                      className={cn(
                        "h-8 w-8 rounded-full transition-all",
                        accent === key && "ring-2 ring-offset-2 ring-offset-background"
                      )}
                      style={{
                        backgroundColor: color.value,
                        boxShadow: accent === key ? `0 0 0 2px var(--color-background), 0 0 0 4px ${color.value}` : undefined,
                      }}
                      title={color.name}
                    />
                  )
                )}
              </div>
            </div>

            <Separator />

            {/* Streamer mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <div>
                  <Label>Streamer Modus</Label>
                  <p className="text-xs text-muted-foreground">
                    Versteckt persoenliche Infos und Einladungscodes
                  </p>
                </div>
              </div>
              <Switch checked={streamerMode} onCheckedChange={toggleStreamerMode} />
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Benutzername</Label>
              <p className="text-sm">{user?.username}</p>
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <p className="text-sm">{user?.email}</p>
            </div>

            <Separator />

            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
