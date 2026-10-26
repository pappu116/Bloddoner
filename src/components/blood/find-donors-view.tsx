"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, MessageSquare, Users, CalendarDays, Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/blood-data";
import type { Donor, ViewKey } from "@/lib/blood-types";
import { MessageDialog } from "./message-dialog";
import { format } from "date-fns";

interface FindDonorsViewProps {
  onNavigate: (v: ViewKey) => void;
}

export function FindDonorsView({ onNavigate }: FindDonorsViewProps) {
  const [donors, setDonors] = useState<Donor[] | null>(null);
  const [group, setGroup] = useState<string>("all");
  const [district, setDistrict] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [msgFor, setMsgFor] = useState<Donor | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (group !== "all") params.set("bloodGroup", group);
    if (district !== "all") params.set("district", district);
    if (search.trim()) params.set("search", search.trim());
    if (availableOnly) params.set("available", "true");
    const res = await fetch(`/api/donors?${params.toString()}`);
    const data = await res.json();
    setDonors(data.donors ?? []);
  }, [group, district, search, availableOnly]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const resetFilters = () => {
    setGroup("all");
    setDistrict("all");
    setSearch("");
    setAvailableOnly(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Blood Donors</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Browse the collection — filter by blood group and location, then call or message directly.
          </p>
        </div>
        <Button
          onClick={() => onNavigate("register")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Droplet className="mr-2 h-4 w-4" /> Register as Donor
        </Button>
      </div>

      <Card className="mt-6 border-border/70 bg-card/60">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-1.5">
              <Label className="text-xs text-zinc-400">Blood group</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {BLOOD_GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-zinc-400">Location</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All districts</SelectItem>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="donor-search" className="text-xs text-zinc-400">Search name / area</Label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  id="donor-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Rakib, Mirpur…"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 lg:justify-center">
              <Switch id="avail-only" checked={availableOnly} onCheckedChange={setAvailableOnly} />
              <Label htmlFor="avail-only" className="text-sm text-zinc-300">Available now only</Label>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-zinc-400">
            Reset filters
          </Button>
        </CardContent>
      </Card>

      {donors === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : donors.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="h-10 w-10 text-zinc-600" />
          <p className="text-sm text-zinc-400">No donors match your filters.</p>
          <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-zinc-500">{donors.length} donor{donors.length !== 1 ? "s" : ""} found</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {donors.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.4) }}
              >
                <Card className="card-glow-hover h-full border-border/70 bg-card/60">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold ring-2 ${
                            d.available
                              ? "bg-primary/15 text-primary ring-primary/40"
                              : "bg-zinc-800 text-zinc-500 ring-zinc-700"
                          }`}
                          aria-hidden
                        >
                          {d.name.charAt(0)}
                        </span>
                        <div>
                          <h3 className="font-semibold leading-tight">{d.name}</h3>
                          <p className="flex items-center gap-1 text-xs text-zinc-400">
                            <MapPin className="h-3 w-3" />
                            {d.area ? `${d.area}, ` : ""}{d.district}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-primary px-2.5 py-1 text-sm font-extrabold text-primary-foreground">
                        {d.bloodGroup}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span
                        className={`h-2 w-2 rounded-full ${d.available ? "bg-emerald-500" : "bg-zinc-600"}`}
                        aria-hidden
                      />
                      <span className={d.available ? "text-emerald-400" : "text-zinc-500"}>
                        {d.available ? "Available" : "Unavailable"}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="flex items-center gap-1 text-zinc-500">
                        <CalendarDays className="h-3 w-3" />
                        {d.lastDonation ? `Last donated ${format(new Date(d.lastDonation), "MMM yyyy")}` : "No donation history"}
                      </span>
                    </div>

                    <div className="mt-4 flex-1" />
                    <div className="flex items-center gap-2 border-t border-border/60 pt-4">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-secondary/60 px-2.5 py-2 text-sm tabular-nums text-zinc-300">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{d.phone}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => setMsgFor(d)}
                      >
                        <MessageSquare className="mr-1.5 h-4 w-4" /> Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <MessageDialog
        open={!!msgFor}
        onOpenChange={(o) => !o && setMsgFor(null)}
        title={msgFor ? `Message ${msgFor.name} (${msgFor.bloodGroup})` : "Message"}
        subject={msgFor ? `To donor ${msgFor.name} — blood donation enquiry` : ""}
      />
    </div>
  );
}
