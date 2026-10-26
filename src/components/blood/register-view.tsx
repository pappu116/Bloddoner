"use client";

import { useState } from "react";
import { Droplet, HeartPulse, Timer, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/blood-data";
import { savePhone } from "@/lib/client-utils";

interface RegisterViewProps {
  onRegistered: (phone: string) => void;
}

const TIPS = [
  { icon: HeartPulse, text: "Donors must be 18–60 years old and above 50 kg body weight." },
  { icon: Timer, text: "Wait at least 4 months (120 days) since your last whole-blood donation." },
  { icon: ShieldCheck, text: "Stay hydrated and eat iron-rich food before donating." },
];

export function RegisterView({ onRegistered }: RegisterViewProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", phone: "", bloodGroup: "", district: "", area: "",
    lastDonation: "", available: true,
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.bloodGroup || !form.district) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      savePhone(form.phone.trim());
      toast({
        title: "You're on the list!",
        description: "When someone in your location needs your blood group, you'll get an instant alert in the Inbox.",
      });
      onRegistered(form.phone.trim());
      setForm({ name: "", phone: "", bloodGroup: "", district: "", area: "", lastDonation: "", available: true });
    } catch {
      toast({ title: "Registration failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Droplet className="h-7 w-7 text-primary" />
            Register as a Blood Donor
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            No account needed — just your name, contact, blood group and location.
          </p>

          <Card className="mt-6 border-border/70 bg-card/60">
            <CardContent className="grid gap-4 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Full name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rakib Hasan" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Phone (WhatsApp) *</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 01711223344" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Blood group *</Label>
                  <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>District / city *</Label>
                  <Select value={form.district} onValueChange={(v) => setForm({ ...form, district: v })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Area (optional)</Label>
                  <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Mirpur 10" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Last donation date (optional)</Label>
                  <Input type="date" value={form.lastDonation} onChange={(e) => setForm({ ...form, lastDonation: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/40 px-4 py-3">
                <div>
                  <Label htmlFor="reg-avail" className="text-sm font-medium">Available for donation</Label>
                  <p className="text-xs text-zinc-500">Turn off if you are temporarily unable to donate.</p>
                </div>
                <Switch id="reg-avail" checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
              </div>
              <Button
                size="lg"
                onClick={submit}
                disabled={saving}
                className="mt-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? "Registering…" : "Join the Donor Network"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-primary/25 bg-gradient-to-b from-primary/10 to-card/60">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <HeartPulse className="h-5 w-5 text-primary" />
                What happens after you register?
              </h2>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-300">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
                  Your name appears in the donor directory with your group & location.
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
                  When a request matches your blood group + district, an alert lands in your Donor Inbox (SMS simulated for now).
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</span>
                  You contact the requester directly — or they contact you.
                </li>
              </ol>
              <div className="mt-6 space-y-3 border-t border-border/60 pt-5">
                {TIPS.map((t) => (
                  <p key={t.text} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-400">
                    <t.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                    {t.text}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
