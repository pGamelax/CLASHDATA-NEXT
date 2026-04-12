"use client";

import { useSession } from "@/auth";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary">
          <path d="M4 10V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 10C4 10 2 10 2 7C2 4 5 4 5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 10C20 10 22 10 22 7C22 4 19 4 19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-base font-bold tracking-tight">
        CLASH<span className="text-primary">DATA</span>
      </span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const isLoggedIn = !isPending && !!session?.user;

  const navLinks = [
    { href: "/pricing", label: "Preços" },
    { href: "/ranking", label: "Ranking" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        <Logo />

        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                pathname?.startsWith(href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Button size="sm" asChild>
              <Link href="/clans">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
