import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { prizes } from "@/db/schema/prizes";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);
  return u?.role === "admin" ? session : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const updates: Partial<typeof prizes.$inferInsert> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.prizeType !== undefined) updates.prizeType = body.prizeType;
  if (body.stockQuantity !== undefined) updates.stockQuantity = Number(body.stockQuantity);
  if (body.isActive !== undefined) updates.isActive = body.isActive ? 1 : 0;
  if (body.badgeId !== undefined) updates.badgeId = body.badgeId || null;

  const [updated] = await db.update(prizes).set(updates).where(eq(prizes.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  await db.delete(prizes).where(eq(prizes.id, id));
  return NextResponse.json({ success: true });
}
