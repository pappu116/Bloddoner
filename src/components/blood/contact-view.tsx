"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Send, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const INFO = [
  { icon: Phone, label: "Hotline", value: "01999-000000", hint: "9am – 11pm, every day" },
  { icon: Mail, label: "Email", value: "help@roktobondhu.com", hint: "Replies within 24 hours" },
  { icon: MapPin, label: "Coverage", value: "All districts, nationwide", hint: "Location-wise matching everywhere" },
];

export function ContactView() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", subject: "", content: "" });
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.content.trim()) {
      toast({ title: "Please fill name, phone and message", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("failed");
      toast({ title: "Message sent!", description: "The admin team will get back to you soon." });
      setForm({ name: "", phone: "", subject: "", content: "" });
    } catch {
      toast({ title: "Could not send message", description: "Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
        <MessageSquare className="h-7 w-7 text-primary" />
        Contact Us
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Questions, partnership ideas, or feedback — send a message, it lands directly in the admin panel.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {INFO.map((i) => (
            <Card key={i.label} className="card-glow-hover border-border/70 bg-card/60">
              <CardContent className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
                  <i.icon className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{i.label}</p>
                  <p className="mt-0.5 font-semibold">{i.value}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{i.hint}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 bg-card/60">
          <CardContent className="grid gap-4 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Your name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Karim Uddin" />
              </div>
              <div className="grid gap-1.5">
                <Label>Your phone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 01712345678" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Want to organize a blood drive" />
            </div>
            <div className="grid gap-1.5">
              <Label>Message *</Label>
              <Textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your message…" />
            </div>
            <Button onClick={submit} disabled={sending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Sending…" : "Send Message"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
