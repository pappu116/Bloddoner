import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [donors, availableDonors, openRequests, fulfilledRequests, notificationsSent, messages] =
    await Promise.all([
      db.donor.count(),
      db.donor.count({ where: { available: true } }),
      db.bloodRequest.count({ where: { status: "OPEN" } }),
      db.bloodRequest.count({ where: { status: "FULFILLED" } }),
      db.notification.count(),
      db.message.count(),
    ]);

  const groupRows = await db.donor.groupBy({ by: ["bloodGroup"], _count: { bloodGroup: true } });
  const districtRows = await db.donor.groupBy({ by: ["district"], _count: { district: true } });

  return NextResponse.json({
    donors,
    availableDonors,
    openRequests,
    fulfilledRequests,
    notificationsSent,
    messages,
    groupDistribution: groupRows.map((g) => ({ group: g.bloodGroup, count: g._count.bloodGroup })),
    districtsCovered: districtRows.length,
  });
}
