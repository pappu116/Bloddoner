import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/server-utils";

const patchSchema = z.object({
  status: z.enum(["OPEN", "FULFILLED"]),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const request = await db.bloodRequest.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ request });
}

// admin only
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await db.bloodRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
