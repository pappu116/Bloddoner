import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ADMIN_PASSWORD } from "@/lib/blood-data";
import { requireAdmin } from "@/lib/server-utils";

// POST /api/admin — verify admin password
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = z.object({ password: z.string() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  if (parsed.data.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, key: ADMIN_PASSWORD });
}

// PATCH /api/requests handled in its own route; here: admin donor availability toggle
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = z
    .object({ donorId: z.string(), available: z.boolean() })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const donor = await db.donor.update({
    where: { id: parsed.data.donorId },
    data: { available: parsed.data.available },
  });
  return NextResponse.json({ donor });
}
