import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { BLOOD_GROUPS } from "@/lib/blood-data";
import { normalizeLocation, requireAdmin } from "@/lib/server-utils";

const donorSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  bloodGroup: z.enum(BLOOD_GROUPS),
  district: z.string().min(2).max(60),
  area: z.string().max(80).optional().nullable(),
  lastDonation: z.string().optional().nullable(), // YYYY-MM-DD
  available: z.boolean().optional(),
});

// GET /api/donors?bloodGroup=&district=&search=&available=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const bloodGroup = sp.get("bloodGroup") || undefined;
  const district = sp.get("district") || undefined;
  const search = sp.get("search") || undefined;
  const availableOnly = sp.get("available") === "true";

  const donors = await db.donor.findMany({
    where: {
      ...(bloodGroup ? { bloodGroup } : {}),
      ...(availableOnly ? { available: true } : {}),
    },
    orderBy: [{ available: "desc" }, { createdAt: "desc" }],
  });

  const filtered = donors.filter((d) => {
    if (district && normalizeLocation(d.district) !== normalizeLocation(district)) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${d.name} ${d.district} ${d.area ?? ""} ${d.bloodGroup}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return NextResponse.json({ donors: filtered });
}

// POST /api/donors — register as donor
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = donorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const donor = await db.donor.create({
    data: {
      name: d.name.trim(),
      phone: d.phone.trim(),
      bloodGroup: d.bloodGroup,
      district: d.district.trim(),
      area: d.area?.trim() || null,
      lastDonation: d.lastDonation ? new Date(d.lastDonation) : null,
      available: d.available ?? true,
    },
  });
  return NextResponse.json({ donor }, { status: 201 });
}

// DELETE /api/donors?id=xxx (admin)
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.donor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
