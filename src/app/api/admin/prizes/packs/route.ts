import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { prizes, prizePacks, prizePackItems } from "@/db/schema/prizes";
import { eq, desc } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);
  return u?.role === "admin" ? session : null;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const packs = await db.select().from(prizePacks).orderBy(desc(prizePacks.createdAt));

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
    .innerJoin(prizes, eq(prizePackItems.prizeId, prizes.id));

  const itemsByPack = new Map<string, typeof items>();
  for (const item of items) {
    if (!itemsByPack.has(item.packId)) itemsByPack.set(item.packId, []);
    itemsByPack.get(item.packId)!.push(item);
  }

  return NextResponse.json(
    packs.map((p) => ({ ...p, items: itemsByPack.get(p.id) ?? [] }))
  );
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json();
  const { name, emoji, description } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const [created] = await db
    .insert(prizePacks)
    .values({ name: name.trim(), emoji: emoji?.trim() || "📦", description: description?.trim() || null, isActive: 1 })
    .returning();

  return NextResponse.json({ ...created, items: [] }, { status: 201 });
}
