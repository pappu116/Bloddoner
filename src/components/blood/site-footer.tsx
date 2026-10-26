"use client";

import { Droplets, Phone, Mail, MapPin } from "lucide-react";
import type { ViewKey } from "@/lib/blood-types";

const LINKS: { key: ViewKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "donors", label: "Find Donors" },
  { key: "requests", label: "Request Blood" },
  { key: "register", label: "Be a Donor" },
  { key: "inbox", label: "Donor Inbox" },
  { key: "contact", label: "Contact" },
];

export function SiteFooter({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
                <Droplets className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-bold">
                Rokto<span className="text-primary">Bondhu</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
              A community blood donor network. Post what you need, get matched
              by blood group and location, and reach out instantly.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <h3 className="text-sm font-semibold text-zinc-200">Quick Links</h3>
            <ul className="mt-3 space-y-2">
              {LINKS.map((l) => (
                <li key={l.key}>
                  <button
                    onClick={() => onNavigate(l.key)}
                    className="text-sm text-zinc-400 transition-colors hover:text-primary"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Reach Us</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Hotline: 01999-000000
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> help@roktobondhu.com
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Serving all districts, nationwide
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-6 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Rokto Bondhu. Donate blood, save lives.</p>
          <p>In an emergency, always call your national emergency number first.</p>
        </div>
      </div>
    </footer>
  );
}
