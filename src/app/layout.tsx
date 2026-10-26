import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rokto Bondhu — Blood Donor Network",
  description:
    "Post blood requests, get matched with nearby donors by blood group and location, and receive instant notifications. Rokto Bondhu connects patients with willing blood donors fast.",
  keywords: ["blood donation", "blood donors", "blood group", "emergency blood", "donor network"],
  icons: {
    icon: "data:image/svg+xml," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444"><path d="M12 2.7s6.5 7.1 6.5 11.6a6.5 6.5 0 1 1-13 0C5.5 9.8 12 2.7 12 2.7z"/></svg>'
    ),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
