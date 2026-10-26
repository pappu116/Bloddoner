import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ADMIN_PASSWORD } from "@/lib/blood-data";
import { requireAdmin } from "@/lib/server-utils";

// POST — check password, returns the key the panel uses on every admin call
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const credentials = z.object({ password: z.string() }).safeParse(body);
  if (!credentials.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  if (credentials.data.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, key: ADMIN_PASSWORD });
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const updateData = z
    .object({ donorId: z.string(), available: z.boolean() })
    .safeParse(body);
  if (!updateData.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const donor = await db.donor.update({
    where: { id: updateData.data.donorId },
    data: { available: updateData.data.available },
  });
  return NextResponse.json({ donor });
}
