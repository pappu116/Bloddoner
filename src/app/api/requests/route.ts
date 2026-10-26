import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { BLOOD_GROUPS, compatibleDonorGroups, normalizeLocation } from "@/lib/blood-data";
import { requireAdmin } from "@/lib/server-utils";

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

// district is matched loosely (case/spacing), so it's filtered after the query
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const bloodGroup = searchParams.get("bloodGroup") || undefined;
  const district = searchParams.get("district") || undefined;

  const requests = await db.bloodRequest.findMany({
    where: {
      ...(status && status !== "all" ? { status } : {}),
      ...(bloodGroup && bloodGroup !== "all" ? { bloodGroup } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const filteredRequests = requests.filter((request) => {
    if (district && normalizeLocation(request.district) !== normalizeLocation(district)) return false;
    return true;
  });

  return NextResponse.json({ requests: filteredRequests });
}

// POST — creates the request and alerts compatible, available donors in the same district
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data", details: parsed.error.flatten() }, { status: 400 });
  }
  const requestData = parsed.data;

  const request = await db.bloodRequest.create({
    data: {
      patientName: requestData.patientName.trim(),
      bloodGroup: requestData.bloodGroup,
      district: requestData.district.trim(),
      hospital: requestData.hospital.trim(),
      urgency: requestData.urgency,
      units: requestData.units,
      contactName: requestData.contactName.trim(),
      phone: requestData.phone.trim(),
      note: requestData.note?.trim() || null,
      neededBy: requestData.neededBy ? new Date(requestData.neededBy) : null,
      status: "OPEN",
    },
  });

  // donor matching: compatible blood group + same district
  const compatibleGroups = compatibleDonorGroups(requestData.bloodGroup);
  const candidates = await db.donor.findMany({
    where: { available: true, bloodGroup: { in: compatibleGroups } },
  });

  const matchedDonors = candidates.filter(
    (donor) => normalizeLocation(donor.district) === normalizeLocation(requestData.district)
  );

  const urgencyLabel =
    requestData.urgency === "URGENT"
      ? "urgent"
      : requestData.urgency === "WITHIN_24H"
        ? "needed within 24 hours"
        : "planned request";

  if (matchedDonors.length > 0) {
    await db.notification.createMany({
      data: matchedDonors.map((donor) => ({
        donorId: donor.id,
        requestId: request.id,
        title: `Blood needed: ${requestData.bloodGroup} at ${requestData.hospital}`,
        body:
          donor.bloodGroup === requestData.bloodGroup
            ? `A ${requestData.bloodGroup} blood request (${requestData.units} unit${requestData.units > 1 ? "s" : ""}) was posted for ${requestData.patientName} at ${requestData.hospital}, ${requestData.district} — ${urgencyLabel}. Contact: ${requestData.contactName} (${requestData.phone}).`
            : `Your blood group ${donor.bloodGroup} is compatible with requested ${requestData.bloodGroup}. Patient ${requestData.patientName} at ${requestData.hospital}, ${requestData.district} — ${urgencyLabel}. Contact: ${requestData.contactName} (${requestData.phone}).`,
        channel: "SMS",
        smsStatus: "SIMULATED",
      })),
    });
  }

  // alerts are only simulated — wire a real SMS gateway (Twilio, local provider) here

  return NextResponse.json({ request, notified: matchedDonors.length }, { status: 201 });
}
