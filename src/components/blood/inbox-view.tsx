"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, SearchCheck, MessageSquare, Smartphone, CheckCheck, UserSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Donor, DonorNotification } from "@/lib/blood-types";
import { savePhone } from "@/lib/client-utils";
import { formatDistanceToNow } from "date-fns";

interface InboxViewProps {
  savedPhone: string;
  onPhoneChecked: (phone: string) => void;
  onUnreadChange: (count: number) => void;
}

export function InboxView({ savedPhone, onPhoneChecked, onUnreadChange }: InboxViewProps) {
  const { toast } = useToast();
  const [phone, setPhone] = useState(savedPhone);
  const [loading, setLoading] = useState(false);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [items, setItems] = useState<DonorNotification[] | null>(null);
  const [searched, setSearched] = useState(false);

  const check = useCallback(async (p: string, silent = false) => {
    if (!p.trim()) {
      toast({ title: "Enter your phone number first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?phone=${encodeURIComponent(p.trim())}`);
      const data = await res.json();
      setSearched(true);
      if (data.donor) {
        setDonor(data.donor);
        setItems(data.notifications ?? []);
        savePhone(p.trim());
        onPhoneChecked(p.trim());
        onUnreadChange(data.unread ?? 0);
        if (!silent) {
          toast({
            title: `Welcome, ${data.donor.name}`,
            description: `${data.unread} unread alert${data.unread === 1 ? "" : "s"} for ${data.donor.bloodGroup}.`,
          });
        }
      } else {
        setDonor(null);
        setItems([]);
        onUnreadChange(0);
        if (!silent) {
          toast({
            title: "No donor found",
            description: "This number is not registered yet. Register as a donor first.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [toast, onPhoneChecked, onUnreadChange]);

  // auto-check saved phone on mount
  useEffect(() => {
    if (savedPhone) check(savedPhone, true);
  }, []);

  const markAllRead = async () => {
    if (!phone) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, all: true }),
    });
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
    onUnreadChange(0);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
        <Bell className="h-7 w-7 text-primary" />
        Donor Inbox
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Enter the phone number you registered with — matching blood request alerts (in-site + SMS) appear here.
      </p>

      <Card className="mt-6 border-border/70 bg-card/60">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="inbox-phone">Your registered phone</Label>
            <Input
              id="inbox-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01711223344"
              onKeyDown={(e) => e.key === "Enter" && check(phone)}
            />
          </div>
          <Button onClick={() => check(phone)} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <SearchCheck className="mr-2 h-4 w-4" />
            {loading ? "Checking…" : "Check Inbox"}
          </Button>
        </CardContent>
      </Card>

      {loading && !searched && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}

      {searched && donor && items && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-foreground">{donor.name}</span>
              <Badge className="ml-2 bg-primary text-primary-foreground">{donor.bloodGroup}</Badge>
            </p>
            {items.some((n) => !n.read) && (
              <Button size="sm" variant="outline" onClick={markAllRead} className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary">
                <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
              <Bell className="h-10 w-10 text-zinc-600" />
              <p className="text-sm text-zinc-400">No alerts yet. You&apos;ll be notified when a matching request posts.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((n) => (
                <li key={n.id}>
                  <Card className={`border-border/70 bg-card/60 ${!n.read ? "border-l-4 border-l-primary" : "opacity-80"}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />}
                        <h3 className="font-semibold leading-snug">{n.title}</h3>
                        <span className="ml-auto text-xs text-zinc-500">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{n.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {n.channel === "SMS" ? (
                          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400">
                            <Smartphone className="mr-1 h-3 w-3" /> SMS ({n.smsStatus.toLowerCase()})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-zinc-500/40 bg-zinc-500/10 text-zinc-400">
                            <MessageSquare className="mr-1 h-3 w-3" /> In-site
                          </Badge>
                        )}
                        {!n.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-zinc-400"
                            onClick={async () => {
                              await fetch("/api/notifications", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ids: [n.id] }),
                              });
                              setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
                              onUnreadChange((items.filter((x) => !x.read).length || 1) - 1);
                            }}
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {searched && !donor && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
          <UserSearch className="h-10 w-10 text-zinc-600" />
          <p className="text-sm text-zinc-400">This number is not registered as a donor yet.</p>
        </div>
      )}
    </div>
  );
}
