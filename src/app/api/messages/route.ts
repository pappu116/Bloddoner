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

// Message viewing is admin-only; the public can submit messages through POST.
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await db.message.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data", details: parsed.error.flatten() }, { status: 400 });
  }
  const messageData = parsed.data;
  const message = await db.message.create({
    data: {
      name: messageData.name.trim(),
      phone: messageData.phone.trim(),
      subject: messageData.subject?.trim() || null,
      content: messageData.content.trim(),
    },
  });
  return NextResponse.json({ message }, { status: 201 });
}
