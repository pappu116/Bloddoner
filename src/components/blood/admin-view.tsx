"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Lock, LayoutDashboard, ClipboardList, Users, MessageSquare, Smartphone,
  CheckCircle2, RotateCcw, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { URGENCY } from "@/lib/blood-data";
import type { BloodRequest, ContactMessage, Donor, DonorNotification, SiteStats } from "@/lib/blood-types";
import { format, formatDistanceToNow } from "date-fns";

export function AdminView() {
  const { toast } = useToast();
  const [key, setKey] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [stats, setStats] = useState<SiteStats | null>(null);
  const [requests, setRequests] = useState<BloodRequest[] | null>(null);
  const [donors, setDonors] = useState<Donor[] | null>(null);
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [smsLog, setSmsLog] = useState<DonorNotification[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "request" | "donor"; id: string; label: string } | null>(null);

  const headers = useCallback((): HeadersInit => ({ "x-admin-key": key ?? "" }), [key]);

  const loadAll = useCallback(async () => {
    if (!key) return;
    const h = headers();
    const [s, r, d, m, n] = await Promise.all([
      fetch("/api/stats").then((x) => x.json()),
      fetch("/api/requests?status=all").then((x) => x.json()),
      fetch("/api/donors").then((x) => x.json()),
      fetch("/api/messages", { headers: h }).then((x) => x.json()),
      fetch("/api/notifications?all=1", { headers: h }).then((x) => x.json()),
    ]);
    setStats(s);
    setRequests(r.requests ?? []);
    setDonors(d.donors ?? []);
    setMessages(m.messages ?? []);
    setSmsLog(n.notifications ?? []);
  }, [key, headers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const unlock = async () => {
    setUnlocking(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Wrong password", variant: "destructive" });
        return;
      }
      setKey(data.key);
      toast({ title: "Admin access granted" });
    } finally {
      setUnlocking(false);
    }
  };

  const toggleFulfilled = async (r: BloodRequest) => {
    const next = r.status === "OPEN" ? "FULFILLED" : "OPEN";
    await fetch(`/api/requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key ?? "" },
      body: JSON.stringify({ status: next }),
    });
    toast({ title: next === "FULFILLED" ? "Marked as fulfilled" : "Reopened request" });
    loadAll();
  };

  const toggleDonor = async (d: Donor) => {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key ?? "" },
      body: JSON.stringify({ donorId: d.id, available: !d.available }),
    });
    toast({ title: d.available ? "Donor set unavailable" : "Donor set available" });
    loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const url = deleteTarget.type === "request" ? `/api/requests/${deleteTarget.id}` : `/api/donors?id=${deleteTarget.id}`;
    await fetch(url, { method: "DELETE", headers: { "x-admin-key": key ?? "" } });
    toast({ title: "Deleted", description: deleteTarget.label });
    setDeleteTarget(null);
    loadAll();
  };

  /* ---------- password gate ---------- */
  if (!key) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24">
        <Card className="w-full border-border/70 bg-card/60">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
              <Lock className="h-6 w-6 text-primary" />
            </span>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="mt-1 text-sm text-zinc-400">Moderate requests, donors and messages.</p>
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="admin-pass" className="text-left text-xs text-zinc-400">Admin password</Label>
              <Input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && unlock()}
                placeholder="Enter password"
              />
              <p className="mt-1 text-left text-xs text-zinc-500">Demo password: <code className="rounded bg-secondary px-1.5 py-0.5 text-zinc-300">admin123</code></p>
            </div>
            <Button onClick={unlock} disabled={unlocking} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {unlocking ? "Checking…" : "Unlock Dashboard"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- dashboard ---------- */
  const statCards = [
    { label: "Donors", value: stats?.donors },
    { label: "Available now", value: stats?.availableDonors },
    { label: "Open requests", value: stats?.openRequests },
    { label: "Alerts sent", value: stats?.notificationsSent },
    { label: "Messages", value: stats?.messages },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
        <LayoutDashboard className="h-7 w-7 text-primary" />
        Admin Dashboard
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/70 bg-card/60">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-zinc-400">{s.label}</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">
                {s.value === undefined ? <Skeleton className="h-7 w-10" /> : s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requests" className="mt-8">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="requests"><ClipboardList className="mr-1.5 h-4 w-4" />Requests</TabsTrigger>
          <TabsTrigger value="donors"><Users className="mr-1.5 h-4 w-4" />Donors</TabsTrigger>
          <TabsTrigger value="messages"><MessageSquare className="mr-1.5 h-4 w-4" />Messages</TabsTrigger>
          <TabsTrigger value="sms"><Smartphone className="mr-1.5 h-4 w-4" />SMS Log</TabsTrigger>
        </TabsList>

        {/* Requests */}
        <TabsContent value="requests">
          <Card className="border-border/70 bg-card/60">
            <CardContent className="max-h-[32rem] overflow-auto p-0">
              {requests === null ? (
                <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.patientName} <span className="text-xs text-zinc-500">({r.units}u)</span></TableCell>
                        <TableCell><Badge className="bg-primary text-primary-foreground">{r.bloodGroup}</Badge></TableCell>
                        <TableCell className="text-zinc-400">{r.district}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={r.status === "FULFILLED" ? "border-emerald-500/40 text-emerald-400" : URGENCY[r.urgency]?.className}>
                            {r.status === "FULFILLED" ? "Done" : URGENCY[r.urgency]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-400">{r.status === "OPEN" ? "Open" : "Fulfilled"}</TableCell>
                        <TableCell className="text-xs text-zinc-500">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-400 hover:text-emerald-300" onClick={() => toggleFulfilled(r)} aria-label="Toggle fulfilled">
                              {r.status === "OPEN" ? <CheckCircle2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => setDeleteTarget({ type: "request", id: r.id, label: `request for ${r.patientName}` })} aria-label="Delete request">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Donors */}
        <TabsContent value="donors">
          <Card className="border-border/70 bg-card/60">
            <CardContent className="max-h-[32rem] overflow-auto p-0">
              {donors === null ? (
                <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donors.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="tabular-nums text-zinc-400">{d.phone}</TableCell>
                        <TableCell><Badge className="bg-primary text-primary-foreground">{d.bloodGroup}</Badge></TableCell>
                        <TableCell className="text-zinc-400">{d.area ? `${d.area}, ` : ""}{d.district}</TableCell>
                        <TableCell>
                          <Switch checked={d.available} onCheckedChange={() => toggleDonor(d)} aria-label="Toggle availability" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => setDeleteTarget({ type: "donor", id: d.id, label: `donor ${d.name}` })} aria-label="Delete donor">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages">
          {messages === null ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : messages.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-zinc-500">No messages yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {messages.map((m) => (
                <Card key={m.id} className="border-border/70 bg-card/60">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{m.name} <span className="text-sm font-normal tabular-nums text-zinc-400">· {m.phone}</span></p>
                      <span className="text-xs text-zinc-500">{format(new Date(m.createdAt), "d MMM, HH:mm")}</span>
                    </div>
                    {m.subject && <p className="mt-1 text-xs font-medium text-primary">{m.subject}</p>}
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{m.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SMS log */}
        <TabsContent value="sms">
          <Card className="border-border/70 bg-card/60">
            <CardContent className="p-5">
              <p className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                <Smartphone className="h-4 w-4 shrink-0" />
                SMS gateway is not connected yet — these are simulated dispatches. Attach a provider API key to deliver real SMS.
              </p>
              {smsLog === null ? (
                <div className="mt-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : smsLog.length === 0 ? (
                <p className="py-10 text-center text-sm text-zinc-500">No alerts dispatched yet.</p>
              ) : (
                <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                  {smsLog.map((n) => (
                    <div key={n.id} className="rounded-lg border border-border/60 bg-secondary/30 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">{n.donor?.name ?? "Donor"}</span>
                        <span className="tabular-nums text-zinc-400">{n.donor?.phone}</span>
                        <Badge variant="outline" className="border-amber-500/40 text-amber-400">SMS · {n.smsStatus.toLowerCase()}</Badge>
                        <span className="ml-auto text-xs text-zinc-500">{format(new Date(n.createdAt), "d MMM, HH:mm")}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{n.title} — {n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
