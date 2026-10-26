export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const DISTRICTS = [
  "Dhaka", "Chattogram", "Khulna", "Rajshahi", "Sylhet", "Barishal",
  "Rangpur", "Mymensingh", "Cumilla", "Narayanganj", "Gazipur", "Bogura",
  "Jashore", "Dinajpur", "Cox's Bazar", "Noakhali", "Tangail", "Faridpur",
  "Kushtia", "Patuakhali", "Pabna", "Jamalpur", "Chandpur", "Brahmanbaria",
] as const;

// for a requested group, which donor groups can safely give blood
export const COMPATIBILITY: Record<string, string[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

export function compatibleDonorGroups(requestedBloodGroup: string): string[] {
  return COMPATIBILITY[requestedBloodGroup] ?? [requestedBloodGroup];
}

export const URGENCY = {
  URGENT: { label: "Urgent", className: "bg-red-500/15 text-red-400 border-red-500/40 animate-pulse" },
  WITHIN_24H: { label: "Within 24h", className: "bg-amber-500/15 text-amber-400 border-amber-500/40" },
  NORMAL: { label: "Planned", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/40" },
} as const;

export type UrgencyKey = keyof typeof URGENCY;

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function normalizeLocation(location: string): string {
  return location.trim().toLowerCase().replace(/\s+/g, " ");
}
