"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Droplet, Search, BellRing, MapPin, ArrowRight, HeartPulse,
  Users, Activity, Siren, ShieldCheck, Clock, Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { URGENCY } from "@/lib/blood-data";
import type { BloodRequest, SiteStats, ViewKey } from "@/lib/blood-types";

interface HomeViewProps {
  onNavigate: (v: ViewKey) => void;
}

const DROP_POSITIONS = [
  { left: "8%", top: "22%", delay: "0s", size: 20 },
  { left: "16%", top: "58%", delay: "1.4s", size: 14 },
  { left: "86%", top: "18%", delay: "0.8s", size: 16 },
  { left: "78%", top: "55%", delay: "2s", size: 22 },
  { left: "50%", top: "12%", delay: "2.8s", size: 12 },
];

const STEPS = [
  {
    icon: Siren,
    title: "1. Post what you need",
    text: "Patient details, blood group, hospital and location — takes less than a minute.",
  },
  {
    icon: BellRing,
    title: "2. Matching donors get notified",
    text: "Donors with a compatible blood group in the same location instantly get an in-site + SMS alert.",
  },
  {
    icon: Handshake,
    title: "3. Donor contacts you",
    text: "Interested donors call you or reply to your post. Blood arranged.",
  },
];

export function HomeView({ onNavigate }: HomeViewProps) {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [urgent, setUrgent] = useState<BloodRequest[]>([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
    fetch("/api/requests?status=OPEN")
      .then((r) => r.json())
      .then((responseData) => {
        const openRequests: BloodRequest[] = responseData.requests ?? [];
        const urgentFirst = openRequests
          .sort(
            (firstRequest, secondRequest) =>
              Number(secondRequest.urgency === "URGENT") - Number(firstRequest.urgency === "URGENT")
          )
          .slice(0, 3);
        setUrgent(urgentFirst);
      })
      .catch(() => {});
  }, []);

  const statCards = [
    { icon: Users, label: "Registered Donors", value: stats?.donors, sub: `${stats?.availableDonors ?? "–"} available now` },
    { icon: Activity, label: "Open Requests", value: stats?.openRequests, sub: `${stats?.fulfilledRequests ?? "–"} fulfilled` },
    { icon: BellRing, label: "Alerts Delivered", value: stats?.notificationsSent, sub: "location-wise matching" },
    { icon: MapPin, label: "Districts Covered", value: stats?.districtsCovered, sub: "and growing" },
  ];

  return (
    <div>
      <section className="hero-glow bg-tech-grid relative overflow-hidden">
        {DROP_POSITIONS.map((dropPosition, index) => (
          <Droplet
            key={index}
            className="animate-drop-float absolute text-primary/40"
            style={{
              left: dropPosition.left,
              top: dropPosition.top,
              animationDelay: dropPosition.delay,
              width: dropPosition.size,
              height: dropPosition.size,
            }}
            aria-hidden
          />
        ))}
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-5 border-primary/40 bg-primary/10 text-primary">
              <BellRing className="mr-1.5 h-3.5 w-3.5" />
              Location-wise donor notifications, instantly
            </Badge>
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
              Every drop counts.{" "}
              <span className="text-glow-red bg-gradient-to-r from-red-500 via-rose-500 to-red-400 bg-clip-text text-transparent">
                Find a donor.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Rokto Bondhu is a community blood network — whoever needs blood
              posts it here, and donors with the matching group in the same
              location get alerted immediately, then contact you directly.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => onNavigate("requests")}
                className="animate-pulse-ring h-12 bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Need Blood? Post Request
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate("donors")}
                className="h-12 border-border px-7 text-base hover:border-primary/50 hover:bg-primary/5"
              >
                <Search className="mr-2 h-4 w-4" />
                Find Donors
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 px-4 py-8 text-center">
              <s.icon className="mb-2 h-5 w-5 text-primary" />
              <span className="text-3xl font-extrabold tabular-nums">
                {s.value === undefined ? <Skeleton className="h-9 w-14" /> : s.value}
              </span>
              <span className="text-sm font-medium text-zinc-300">{s.label}</span>
              <span className="text-xs text-zinc-500">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-400">
          From urgent post to matched donor in three simple steps.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Card className="card-glow-hover h-full border-border/70 bg-card/60">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
                    <step.icon className="h-5.5 w-5.5 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Siren className="h-6 w-6 text-primary" />
              Urgent requests
            </h2>
            <p className="mt-1 text-sm text-zinc-400">Open posts waiting for donors right now.</p>
          </div>
          <Button variant="ghost" onClick={() => onNavigate("requests")} className="text-primary hover:text-primary">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {urgent.length === 0 ? (
            <p className="col-span-full rounded-lg border border-dashed border-border py-10 text-center text-sm text-zinc-500">
              No open requests right now — post one if you need blood.
            </p>
          ) : (
            urgent.map((r) => (
              <Card key={r.id} className="card-glow-hover cursor-pointer border-border/70 bg-card/60" onClick={() => onNavigate("requests")}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-primary font-bold text-primary-foreground">{r.bloodGroup}</Badge>
                    <Badge variant="outline" className={URGENCY[r.urgency]?.className}>
                      {URGENCY[r.urgency]?.label ?? r.urgency}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">{r.patientName}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {r.hospital}, {r.district}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {r.units} unit{r.units > 1 ? "s" : ""} · contact {r.contactName}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="card-glow relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-8 text-center sm:p-12">
          <HeartPulse className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Be someone&apos;s hero today</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400 sm:text-base">
            Register once with your blood group and location — when someone near
            you needs your blood, you&apos;ll know first.
          </p>
          <Button
            size="lg"
            onClick={() => onNavigate("register")}
            className="mt-6 h-12 bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Register as a Donor
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5" /> Free forever · No account needed
          </p>
        </div>
      </section>
    </div>
  );
}
