import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { prizes, prizePacks, prizePackItems } from "@/db/schema/prizes";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);
  return u?.role === "admin" ? session : null;
}

// PATCH: update pack metadata and/or replace items
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // Update pack metadata
  const updates: Partial<typeof prizePacks.$inferInsert> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.emoji !== undefined) updates.emoji = body.emoji.trim() || "📦";
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.isActive !== undefined) updates.isActive = body.isActive ? 1 : 0;

  if (Object.keys(updates).length > 0) {
    const [updated] = await db.update(prizePacks).set(updates).where(eq(prizePacks.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Pack não encontrado" }, { status: 404 });
  }

  // Replace items if provided
  if (Array.isArray(body.items)) {
    await db.delete(prizePackItems).where(eq(prizePackItems.packId, id));
    if (body.items.length > 0) {
      await db.insert(prizePackItems).values(
        body.items.map((item: { prizeId: string; quantity: number }) => ({
          packId: id,
          prizeId: item.prizeId,
          quantity: Math.max(1, Number(item.quantity) || 1),
        }))
      );
    }
  }

  // Return updated pack with items
  const [pack] = await db.select().from(prizePacks).where(eq(prizePacks.id, id)).limit(1);
  const items = await db
    .select({
      id: prizePackItems.id,
      packId: prizePackItems.packId,
      quantity: prizePackItems.quantity,
      prizeId: prizes.id,
      prizeName: prizes.name,
      prizeType: prizes.prizeType,
    })
    .from(prizePackItems)
    .innerJoin(prizes, eq(prizePackItems.prizeId, prizes.id))
    .where(eq(prizePackItems.packId, id));

  return NextResponse.json({ ...pack, items });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  await db.delete(prizePacks).where(eq(prizePacks.id, id));
  return NextResponse.json({ success: true });
}
