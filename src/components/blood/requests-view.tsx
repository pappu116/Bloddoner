"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, MapPin, Phone, Clock, Siren, HandHeart, ClipboardList, User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BLOOD_GROUPS, DISTRICTS, URGENCY } from "@/lib/blood-data";
import type { BloodRequest } from "@/lib/blood-types";
import { MessageDialog } from "./message-dialog";
import { format, formatDistanceToNow } from "date-fns";

export function RequestsView() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<BloodRequest[] | null>(null);
  const [status, setStatus] = useState<string>("OPEN");
  const [group, setGroup] = useState<string>("all");
  const [district, setDistrict] = useState<string>("all");
  const [postOpen, setPostOpen] = useState(false);
  const [donateFor, setDonateFor] = useState<BloodRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // post form state
  const [form, setForm] = useState({
    patientName: "", bloodGroup: "", district: "", hospital: "",
    urgency: "URGENT", units: "1", neededBy: "", contactName: "", phone: "", note: "",
  });

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (group !== "all") params.set("bloodGroup", group);
    if (district !== "all") params.set("district", district);
    const res = await fetch(`/api/requests?${params.toString()}`);
    const data = await res.json();
    setRequests(data.requests ?? []);
  }, [status, group, district]);

  useEffect(() => {
    load();
  }, [load]);

  const submitRequest = async () => {
    if (!form.patientName.trim() || !form.bloodGroup || !form.district || !form.hospital.trim() || !form.contactName.trim() || !form.phone.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, units: Number(form.units) || 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      toast({
        title: "Request posted!",
        description:
          data.notified > 0
            ? `${data.notified} matching donor${data.notified !== 1 ? "s" : ""} in ${form.district} notified (in-site + SMS).`
            : "No matching donors in this location yet — donors can still see your post on the board.",
      });
      setPostOpen(false);
      setForm({
        patientName: "", bloodGroup: "", district: "", hospital: "",
        urgency: "URGENT", units: "1", neededBy: "", contactName: "", phone: "", note: "",
      });
      setStatus("OPEN");
      load();
    } catch {
      toast({ title: "Could not post request", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Board</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Whoever needs blood posts here — donors with a compatible group in the same location get alerted instantly.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setPostOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" /> Post Request
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="FULFILLED">Fulfilled</SelectItem>
            <SelectItem value="all">All status</SelectItem>
          </SelectContent>
        </Select>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {BLOOD_GROUPS.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All districts</SelectItem>
            {DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {requests === null ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="h-10 w-10 text-zinc-600" />
          <p className="text-sm text-zinc-400">No requests found for these filters.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {requests.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.35) }}
            >
              <Card
                className={`card-glow-hover h-full border-border/70 bg-card/60 ${
                  r.urgency === "URGENT" && r.status === "OPEN" ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary px-2.5 py-1 text-sm font-extrabold text-primary-foreground">
                      {r.bloodGroup}
                    </Badge>
                    <Badge variant="outline" className={r.status === "FULFILLED" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : URGENCY[r.urgency]?.className}>
                      {r.status === "FULFILLED" ? "Fulfilled" : (URGENCY[r.urgency]?.label ?? r.urgency)}
                    </Badge>
                    <span className="ml-auto text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <h3 className="mt-3 flex items-center gap-2 text-lg font-semibold">
                    <User className="h-4.5 w-4.5 text-zinc-400" />
                    {r.patientName}
                    <span className="text-sm font-normal text-zinc-400">· {r.units} unit{r.units > 1 ? "s" : ""}</span>
                  </h3>

                  <div className="mt-2 space-y-1.5 text-sm text-zinc-400">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-primary/80" />
                      {r.hospital}, {r.district}
                    </p>
                    {r.neededBy && (
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-primary/80" />
                        Needed by {format(new Date(r.neededBy), "EEE, d MMM yyyy")}
                      </p>
                    )}
                    {r.note && <p className="rounded-md bg-secondary/50 px-3 py-2 text-xs leading-relaxed text-zinc-300">{r.note}</p>}
                  </div>

                  <div className="mt-4 flex-1" />
                  <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                    <span className="flex items-center gap-1.5 rounded-md bg-secondary/60 px-2.5 py-2 text-sm tabular-nums text-zinc-300">
                      <Phone className="h-3.5 w-3.5 text-primary" /> {r.contactName} · {r.phone}
                    </span>
                    {r.status === "OPEN" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => setDonateFor(r)}
                      >
                        <HandHeart className="mr-1.5 h-4 w-4" /> I want to donate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Post request dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-primary" /> Post a blood request
            </DialogTitle>
            <DialogDescription>
              Compatible donors in the same location will be notified instantly — in-site and via SMS.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Patient name *</Label>
                <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="e.g. Abdul Karim" />
              </div>
              <div className="grid gap-1.5">
                <Label>Blood group *</Label>
                <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Hospital / clinic *</Label>
                <Input value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} placeholder="e.g. Square Hospital" />
              </div>
              <div className="grid gap-1.5">
                <Label>Location (district) *</Label>
                <Select value={form.district} onValueChange={(v) => setForm({ ...form, district: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label>Urgency</Label>
                <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="WITHIN_24H">Within 24h</SelectItem>
                    <SelectItem value="NORMAL">Planned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Units (bags)</Label>
                <Input type="number" min={1} max={20} value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Needed by</Label>
                <Input type="date" value={form.neededBy} onChange={(e) => setForm({ ...form, neededBy: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Contact person *</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="e.g. Rahim Karim" />
              </div>
              <div className="grid gap-1.5">
                <Label>Contact phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 01712345678" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Note (optional)</Label>
              <Textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Surgery tomorrow morning, please call anytime." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostOpen(false)}>Cancel</Button>
            <Button onClick={submitRequest} disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? "Posting…" : "Post Request & Notify Donors"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MessageDialog
        open={!!donateFor}
        onOpenChange={(o) => !o && setDonateFor(null)}
        title={donateFor ? `Respond to ${donateFor.patientName}'s request` : "Respond"}
        subject={donateFor ? `I want to donate ${donateFor.bloodGroup} blood for ${donateFor.patientName} (${donateFor.hospital})` : ""}
      />
    </div>
  );
}
