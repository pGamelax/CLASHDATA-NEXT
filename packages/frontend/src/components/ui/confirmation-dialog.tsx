"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string | React.ReactNode;
  confirmationText: string; // Texto que o usuário precisa digitar
  onConfirm: () => void;
  confirmButtonText?: string;
  confirmButtonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
}

export function ConfirmationDialog({
  trigger,
  title,
  description,
  confirmationText,
  onConfirm,
  confirmButtonText = "Confirmar",
  confirmButtonVariant = "destructive",
  disabled = false,
}: ConfirmationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isConfirming, setIsConfirming] = React.useState(false);

  const isMatch = inputValue.trim().toLowerCase() === confirmationText.trim().toLowerCase();

  const handleConfirm = async () => {
    if (!isMatch) return;
    
    setIsConfirming(true);
    try {
      await onConfirm();
      setOpen(false);
      setInputValue("");
    } catch (error) {
      // Erro será tratado pelo componente pai
    } finally {
      setIsConfirming(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputValue("");
    }
    setOpen(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <div className="text-sm text-muted-foreground">{description}</div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmation-input" className="text-xs">
                  Digite <span className="font-mono font-semibold">{confirmationText}</span> para confirmar:
                </Label>
                <Input
                  id="confirmation-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={confirmationText}
                  disabled={isConfirming}
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isMatch && !isConfirming) {
                      handleConfirm();
                    }
                  }}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isMatch || isConfirming}
            className={confirmButtonVariant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isConfirming ? "Processando..." : confirmButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
