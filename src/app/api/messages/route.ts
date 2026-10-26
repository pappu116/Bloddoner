import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/server-utils";

const messageSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  subject: z.string().max(120).optional().nullable(),
  content: z.string().min(2).max(1000),
});

// GET /api/messages (admin)
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await db.message.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ messages });
}

// POST /api/messages — public contact form / donor messaging
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data", details: parsed.error.flatten() }, { status: 400 });
  }
  const m = parsed.data;
  const message = await db.message.create({
    data: {
      name: m.name.trim(),
      phone: m.phone.trim(),
      subject: m.subject?.trim() || null,
      content: m.content.trim(),
    },
  });
  return NextResponse.json({ message }, { status: 201 });
}
