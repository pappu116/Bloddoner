"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteNav } from "@/components/blood/site-nav";
import { SiteFooter } from "@/components/blood/site-footer";
import { HomeView } from "@/components/blood/home-view";
import { FindDonorsView } from "@/components/blood/find-donors-view";
import { RequestsView } from "@/components/blood/requests-view";
import { RegisterView } from "@/components/blood/register-view";
import { InboxView } from "@/components/blood/inbox-view";
import { ContactView } from "@/components/blood/contact-view";
import { AdminView } from "@/components/blood/admin-view";
import { getSavedPhone } from "@/lib/client-utils";
import type { ViewKey } from "@/lib/blood-types";

export default function Home() {
  const [view, setView] = useState<ViewKey>("home");
  const [savedPhone, setSavedPhone] = useState(() => getSavedPhone());
  const [unreadCount, setUnreadCount] = useState(0);

  // refresh unread badge for the saved phone
  useEffect(() => {
    if (!savedPhone) return;
    let active = true;
    const check = () =>
      fetch(`/api/notifications?phone=${encodeURIComponent(savedPhone)}`)
        .then((r) => r.json())
        .then((d) => {
          if (active) setUnreadCount(d.unread ?? 0);
        })
        .catch(() => {});
    check();
    const t = setInterval(check, 20000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [savedPhone]);

  const navigate = useCallback((v: ViewKey) => {
    setView(v);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav view={view} onNavigate={navigate} unreadCount={unreadCount} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {view === "home" && <HomeView onNavigate={navigate} />}
            {view === "donors" && <FindDonorsView onNavigate={navigate} />}
            {view === "requests" && <RequestsView />}
            {view === "register" && (
              <RegisterView
                onRegistered={(phone) => {
                  setSavedPhone(phone);
                  navigate("inbox");
                }}
              />
            )}
            {view === "inbox" && (
              <InboxView
                savedPhone={savedPhone}
                onPhoneChecked={setSavedPhone}
                onUnreadChange={setUnreadCount}
              />
            )}
            {view === "contact" && <ContactView />}
            {view === "admin" && <AdminView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <SiteFooter onNavigate={navigate} />
    </div>
  );
}
