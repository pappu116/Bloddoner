import { NextRequest } from "next/server";
import { ADMIN_PASSWORD, normalizeLocation } from "@/lib/blood-data";

export { normalizeLocation };

export function requireAdmin(req: NextRequest): boolean {
  return req.headers.get("x-admin-key") === ADMIN_PASSWORD;
}

export function normalizePhone(p: string): string {
  return p.replace(/[\s\-()+]/g, "");
}
