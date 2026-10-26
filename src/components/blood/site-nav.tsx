"use client";

import { useState } from "react";
import { Droplets, Menu, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ViewKey } from "@/lib/blood-types";

const NAV_ITEMS: { key: ViewKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "donors", label: "Find Donors" },
  { key: "requests", label: "Request Board" },
  { key: "register", label: "Be a Donor" },
  { key: "inbox", label: "Inbox" },
  { key: "contact", label: "Contact" },
];

interface SiteNavProps {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
  unreadCount: number;
}

export function SiteNav({ view, onNavigate, unreadCount }: SiteNavProps) {
  const [open, setOpen] = useState(false);

  const go = (v: ViewKey) => {
    onNavigate(v);
    setOpen(false);
  };

  const linkBtn = (item: { key: ViewKey; label: string }) => {
    const active = view === item.key;
    return (
      <button
        key={item.key}
        onClick={() => go(item.key)}
        className={`relative h-9 rounded-md px-3 text-sm font-medium transition-colors ${
          active
            ? "text-primary"
            : "text-zinc-400 hover:text-foreground hover:bg-secondary"
        }`}
      >
        {item.label}
        {item.key === "inbox" && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {active && (
          <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary shadow-[0_0_12px_oklch(0.637_0.237_25.331)]" />
        )}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => go("home")}
          className="flex items-center gap-2.5"
          aria-label="Rokto Bondhu home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_0_20px_-4px_oklch(0.637_0.237_25.331)]">
            <Droplets className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Rokto<span className="text-primary">Bondhu</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_ITEMS.map(linkBtn)}
          <button
            onClick={() => go("admin")}
            className={`ml-2 flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${
              view === "admin"
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-zinc-400 hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin
          </button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => go("inbox")}
            className="relative flex h-10 w-10 items-center justify-center rounded-md text-zinc-300 hover:bg-secondary"
            aria-label="Donor inbox"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-border bg-card">
              <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                <Droplets className="h-5 w-5 text-primary" />
                Rokto Bondhu
              </SheetTitle>
              <nav className="mt-4 flex flex-col gap-1" aria-label="Mobile navigation">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => go(item.key)}
                    className={`relative flex h-11 items-center justify-between rounded-md px-3 text-sm font-medium ${
                      view === item.key
                        ? "bg-primary/10 text-primary"
                        : "text-zinc-300 hover:bg-secondary"
                    }`}
                  >
                    {item.label}
                    {item.key === "inbox" && unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => go("admin")}
                  className={`flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium ${
                    view === "admin" ? "bg-primary/10 text-primary" : "text-zinc-300 hover:bg-secondary"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
