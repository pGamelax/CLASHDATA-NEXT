"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/auth";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// DiceBear avatar presets — avataaars style with distinct seeds
const AVATAR_PRESETS = [
  { seed: "Avalon", bg: "b6e3f4" },
  { seed: "Cleo", bg: "c0aede" },
  { seed: "Ryker", bg: "ffdfbf" },
  { seed: "Jade", bg: "d1d4f9" },
  { seed: "Zara", bg: "ffd5dc" },
  { seed: "Blaze", bg: "c0e6c0" },
  { seed: "Nova", bg: "f4d03f" },
  { seed: "Titan", bg: "f0b27a" },
  { seed: "Luna", bg: "a9cce3" },
  { seed: "Rex", bg: "d7bde2" },
  { seed: "Iris", bg: "a3e4d7" },
  { seed: "Orion", bg: "fadbd8" },
];

function getAvatarUrl(seed: string, bg: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=${bg}&radius=50`;
}

function getDefaultAvatar(name: string) {
  const seed = encodeURIComponent(name || "user");
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,ffdfbf,d1d4f9,ffd5dc,c0e6c0`;
}

interface AvatarSettingsProps {
  currentImage: string | null;
  userName: string;
}

export function AvatarSettings({ currentImage, userName }: AvatarSettingsProps) {
  const [selected, setSelected] = useState<string | null>(currentImage || getDefaultAvatar(userName));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSave = async () => {
    if (!selected || selected === currentImage) return;
    setSaving(true);
    try {
      await authClient.updateUser({ image: selected });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // noop
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 border-2 border-border">
          <AvatarImage src={selected || getDefaultAvatar(userName)} alt={userName} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-base">{userName}</p>
          <p className="text-sm text-muted-foreground">Escolha um avatar abaixo</p>
        </div>
      </div>

      {/* Avatar grid */}
      <div>
        <p className="text-sm font-medium mb-3">Avatares disponíveis</p>
        <div className="grid grid-cols-6 gap-4">
          {AVATAR_PRESETS.map(({ seed, bg }) => {
            const url = getAvatarUrl(seed, bg);
            const isSelected = selected === url;
            return (
              <button
                key={seed}
                type="button"
                onClick={() => setSelected(url)}
                className={cn(
                  "relative h-12 w-12 rounded-full transition-all duration-150 focus-visible:outline-none",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "ring-2 ring-transparent ring-offset-2 ring-offset-background hover:ring-border"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={seed}
                  className="h-12 w-12 rounded-full"
                />
                {isSelected && (
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-primary ring-2 ring-background">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          onClick={handleSave}
          disabled={saving || !selected || selected === currentImage}
          className="gap-2"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
          ) : saved ? (
            <><Check className="h-4 w-4" /> Salvo!</>
          ) : (
            "Salvar avatar"
          )}
        </Button>
        {selected && selected !== currentImage && (
          <p className="text-xs text-muted-foreground">Você tem alterações não salvas</p>
        )}
      </div>
    </div>
  );
}
