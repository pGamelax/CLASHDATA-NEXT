"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
}

const STORAGE_KEY = "dismissed_announcements";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function dismiss(id: string) {
  const current = getDismissed();
  if (!current.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]));
  }
}

export function AnnouncementModal() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const [open, setOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    fetch(`${apiUrl}/announcements/active`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: Announcement[]) => {
        const dismissed = getDismissed();
        const pending = data.filter((a) => !dismissed.includes(a.id));
        if (pending.length > 0) {
          setAnnouncements(pending);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, [apiUrl]);

  if (announcements.length === 0) return null;

  const item = announcements[current];
  const isLast = current === announcements.length - 1;

  function handleNext() {
    if (dontShow) dismiss(item.id);
    if (!isLast) {
      setCurrent((c) => c + 1);
      setDontShow(false);
    } else {
      setOpen(false);
    }
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      if (dontShow) dismiss(item.id);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Novidade
            </span>
            {announcements.length > 1 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {current + 1} / {announcements.length}
              </span>
            )}
          </div>
          <DialogTitle className="text-lg">{item.title}</DialogTitle>
          <DialogDescription className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {item.content}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={dontShow}
              onCheckedChange={(v) => setDontShow(!!v)}
              id="dont-show"
            />
            <span className="text-xs text-muted-foreground" htmlFor="dont-show">
              Não mostrar novamente
            </span>
          </label>

          <Button size="sm" onClick={handleNext}>
            {isLast ? "Entendi" : "Próximo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
