import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, requireAdmin } from "@/lib/server-utils";

// GET /api/notifications?phone=01xxxxxxxxx   → donor inbox
// GET /api/notifications?all=1               → admin SMS log
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  if (sp.get("all") === "1") {
    if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const all = await db.notification.findMany({
      include: { donor: { select: { name: true, phone: true, district: true, bloodGroup: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ notifications: all });
  }

  const phone = sp.get("phone");
  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  const donor = await db.donor.findFirst({
    where: { phone: { in: [phone, normalizePhone(phone)] } },
    include: { notifications: { orderBy: { createdAt: "desc" } } },
  });

  if (!donor) {
    return NextResponse.json({ donor: null, notifications: [], unread: 0 });
  }

  return NextResponse.json({
    donor: { id: donor.id, name: donor.name, bloodGroup: donor.bloodGroup },
    notifications: donor.notifications,
    unread: donor.notifications.filter((n) => !n.read).length,
  });
}

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
  phone: z.string().optional(),
  all: z.boolean().optional(),
});

// PATCH /api/notifications — mark as read
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { ids, phone, all } = parsed.data;

  if (ids && ids.length > 0) {
    await db.notification.updateMany({ where: { id: { in: ids } }, data: { read: true } });
  } else if (all && phone) {
    const donor = await db.donor.findFirst({ where: { phone: { in: [phone, normalizePhone(phone)] } } });
    if (donor) {
      await db.notification.updateMany({ where: { donorId: donor.id }, data: { read: true } });
    }
  } else {
    return NextResponse.json({ error: "ids or phone+all required" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
