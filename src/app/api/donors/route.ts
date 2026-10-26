import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { BLOOD_GROUPS, normalizeLocation } from "@/lib/blood-data";
import { requireAdmin } from "@/lib/server-utils";

const donorSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  bloodGroup: z.enum(BLOOD_GROUPS),
  district: z.string().min(2).max(60),
  area: z.string().max(80).optional().nullable(),
  lastDonation: z.string().optional().nullable(), // YYYY-MM-DD
  available: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const bloodGroup = searchParams.get("bloodGroup") || undefined;
  const district = searchParams.get("district") || undefined;
  const search = searchParams.get("search") || undefined;
  const availableOnly = searchParams.get("available") === "true";

  const donors = await db.donor.findMany({
    where: {
      ...(bloodGroup ? { bloodGroup } : {}),
      ...(availableOnly ? { available: true } : {}),
    },
    orderBy: [{ available: "desc" }, { createdAt: "desc" }],
  });

  const filteredDonors = donors.filter((donor) => {
    if (district && normalizeLocation(donor.district) !== normalizeLocation(district)) return false;
    if (search) {
      const normalizedSearch = search.toLowerCase();
      const searchableDonorDetails =
        `${donor.name} ${donor.district} ${donor.area ?? ""} ${donor.bloodGroup}`.toLowerCase();
      if (!searchableDonorDetails.includes(normalizedSearch)) return false;
    }
    return true;
  });

  return NextResponse.json({ donors: filteredDonors });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = donorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data", details: parsed.error.flatten() }, { status: 400 });
  }
  const donorData = parsed.data;
  const donor = await db.donor.create({
    data: {
      name: donorData.name.trim(),
      phone: donorData.phone.trim(),
      bloodGroup: donorData.bloodGroup,
      district: donorData.district.trim(),
      area: donorData.area?.trim() || null,
      lastDonation: donorData.lastDonation ? new Date(donorData.lastDonation) : null,
      available: donorData.available ?? true,
    },
  });
  return NextResponse.json({ donor }, { status: 201 });
}

// admin only
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const donorId = req.nextUrl.searchParams.get("id");
  if (!donorId) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.donor.delete({ where: { id: donorId } });
  return NextResponse.json({ ok: true });
}
