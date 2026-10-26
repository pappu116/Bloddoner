"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subject: string;
}

export function MessageDialog({ open, onOpenChange, title, subject }: MessageDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !content.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, subject, content }),
      });
      if (!res.ok) throw new Error("failed");
      toast({
        title: "Message sent",
        description: "The person will see your message. You can also call them directly.",
      });
      setName("");
      setPhone("");
      setContent("");
      onOpenChange(false);
    } catch {
      toast({ title: "Could not send message", description: "Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Your message is delivered inside the site — the receiver is also
            listed with a phone number, so you can call directly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="msg-name">Your name</Label>
            <Input id="msg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Karim Uddin" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="msg-phone">Your phone</Label>
            <Input id="msg-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 01712345678" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="msg-content">Message</Label>
            <Textarea
              id="msg-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Write your message…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={sending} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Sending…" : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
