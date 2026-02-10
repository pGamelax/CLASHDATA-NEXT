"use client";

import { useState } from "react";
import { Building2, ChevronsUpDown, Plus, Check, List } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  subscription?: {
    status?: string;
    plan?: string;
  } | null;
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
  onSelect: (orgId: string) => void;
  isLoading?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function OrganizationSelector({
  organizations,
  currentOrganization,
  onSelect,
  isLoading = false,
  user,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const getSubscriptionBadge = (org: Organization) => {
    // Se tem subscription com plano, sempre mostra o plano
    if (org.subscription?.plan) {
      const planName = org.subscription.plan;
      const planDisplayName = planName === "MESTRE" ? "Mestre" : 
                              planName === "CAMPEAO" ? "Campeão" : 
                              planName === "TITA" ? "Titã" : planName;
      
      // Se está ativa ou em trial, usa badge primary
      if (org.subscription.status === "TRIAL" || org.subscription.status === "ACTIVE") {
        return <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{planDisplayName}</Badge>;
      }
      
      // Se está expirada ou cancelada, usa badge secondary
      return <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">{planDisplayName}</Badge>;
    }
    
    // Se não tem subscription ou plano, mostra FREE
    return <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">FREE</Badge>;
  };


  if (!currentOrganization && organizations.length === 0) {
    return (
      <button
        onClick={() => router.push("/org/new")}
        className="flex items-center gap-2 p-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
      >
        <Plus className="h-4 w-4" />
        <span>Criar Organização</span>
      </button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 sm:gap-2.5 p-1 rounded-md sm:rounded-lg bg-muted/80 hover:bg-muted transition-colors text-xs sm:text-sm font-medium",
            "sm:min-w-40 sm:max-w-55",
            "focus:outline-none"
          )}
          disabled={isLoading}
        >
          {/* Ícone da organização */}
          <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-primary/10 shrink-0">
            {currentOrganization?.logo ? (
              <img
                src={currentOrganization.logo}
                alt={currentOrganization.name}
                className="w-full h-full rounded-md object-cover"
              />
            ) : (
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            )}
          </div>
          
          {/* Nome da organização - escondido no mobile */}
          <span className="hidden sm:flex truncate flex-1 text-left text-foreground gap-2 ">
            {currentOrganization?.name || "Selecione uma organização"}
          {currentOrganization && getSubscriptionBadge(currentOrganization)}
          </span>
          
          {/* Badge de status */}
          
          {/* Ícone de setas */}
          <ChevronsUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-60 z-50">
        {organizations.length > 0 ? (
          <>
            {organizations.map((org) => {
              const isSelected = currentOrganization?.id === org.id;
              return (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => {
                    onSelect(org.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 p-1 cursor-pointer",
                    isSelected && "bg-accent"
                  )}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 shrink-0">
                    {org.logo ? (
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="w-full h-full rounded-md object-cover"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="flex-1 truncate">{org.name}</span>
                  {getSubscriptionBadge(org)}
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setOpen(false);
                router.push("/organizations");
              }}
              className="flex items-center gap-2 p-1 cursor-pointer"
            >
              <List className="h-4 w-4" />
              <span>Ver todas as orgs</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setOpen(false);
                router.push("/pricing");
              }}
              className="flex items-center gap-2 p-1 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Organização</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => {
                setOpen(false);
                router.push("/organizations");
              }}
              className="flex items-center gap-2 p-1 cursor-pointer"
            >
              <List className="h-4 w-4" />
              <span>Ver todas as orgs</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setOpen(false);
                router.push("/org/new");
              }}
              className="flex items-center gap-2 p-1 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Organização</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
