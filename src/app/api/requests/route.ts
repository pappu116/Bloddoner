import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { BLOOD_GROUPS, compatibleDonorGroups } from "@/lib/blood-data";
import { normalizeLocation, requireAdmin } from "@/lib/server-utils";

const requestSchema = z.object({
  patientName: z.string().min(2).max(80),
  bloodGroup: z.enum(BLOOD_GROUPS),
  district: z.string().min(2).max(60),
  hospital: z.string().min(2).max(120),
  urgency: z.enum(["URGENT", "WITHIN_24H", "NORMAL"]).default("NORMAL"),
  units: z.coerce.number().int().min(1).max(20).default(1),
  contactName: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  note: z.string().max(500).optional().nullable(),
  neededBy: z.string().optional().nullable(),
});

// GET /api/requests?status=&bloodGroup=&district=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const bloodGroup = sp.get("bloodGroup") || undefined;
  const district = sp.get("district") || undefined;

  const requests = await db.bloodRequest.findMany({
    where: {
      ...(status && status !== "all" ? { status } : {}),
      ...(bloodGroup && bloodGroup !== "all" ? { bloodGroup } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const filtered = requests.filter((r) => {
    if (district && normalizeLocation(r.district) !== normalizeLocation(district)) return false;
    return true;
  });

  return NextResponse.json({ requests: filtered });
}

// POST /api/requests — create request + notify matching donors (location + blood group wise)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data", details: parsed.error.flatten() }, { status: 400 });
  }
  const r = parsed.data;

  const request = await db.bloodRequest.create({
    data: {
      patientName: r.patientName.trim(),
      bloodGroup: r.bloodGroup,
      district: r.district.trim(),
      hospital: r.hospital.trim(),
      urgency: r.urgency,
      units: r.units,
      contactName: r.contactName.trim(),
      phone: r.phone.trim(),
      note: r.note?.trim() || null,
      neededBy: r.neededBy ? new Date(r.neededBy) : null,
      status: "OPEN",
    },
  });

  // --- Location-wise + blood-group-wise donor matching & notification ---
  const compatibleGroups = compatibleDonorGroups(r.bloodGroup);
  const candidates = await db.donor.findMany({
    where: { available: true, bloodGroup: { in: compatibleGroups } },
  });

  const matched = candidates.filter(
    (d) => normalizeLocation(d.district) === normalizeLocation(r.district)
  );

  const urgencyLabel =
    r.urgency === "URGENT" ? "URGENT" : r.urgency === "WITHIN_24H" ? "needed within 24 hours" : "planned request";

  if (matched.length > 0) {
    await db.notification.createMany({
      data: matched.map((d) => ({
        donorId: d.id,
        requestId: request.id,
        title: `Blood needed: ${r.bloodGroup} at ${r.hospital}`,
        body:
          d.bloodGroup === r.bloodGroup
            ? `A ${r.bloodGroup} blood request (${r.units} unit${r.units > 1 ? "s" : ""}) was posted for ${r.patientName} at ${r.hospital}, ${r.district} — ${urgencyLabel}. Contact: ${r.contactName} (${r.phone}).`
            : `Your blood group ${d.bloodGroup} is compatible with requested ${r.bloodGroup}. Patient ${r.patientName} at ${r.hospital}, ${r.district} — ${urgencyLabel}. Contact: ${r.contactName} (${r.phone}).`,
        channel: "SMS",
        smsStatus: "SIMULATED",
      })),
    });
  }

  // Simulated SMS dispatch (records above use channel=SMS).
  // Real SMS: plug an SMS gateway API (e.g. Twilio / local provider) here and send to matched donor phones.

  return NextResponse.json({ request, notified: matched.length }, { status: 201 });
}
