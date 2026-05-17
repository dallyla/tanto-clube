import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { prizes } from "@/db/schema/prizes";
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

  const rows = await db.select().from(prizes).orderBy(desc(prizes.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json();
  const { name, description, prizeType, stockQuantity, badgeId } = body;

  if (!name?.trim() || !prizeType) {
    return NextResponse.json({ error: "Nome e tipo são obrigatórios" }, { status: 400 });
  }

  if (prizeType === "badge" && !badgeId) {
    return NextResponse.json({ error: "Selecione um badge" }, { status: 400 });
  }

  const [created] = await db
    .insert(prizes)
    .values({
      name: name.trim(),
      description: description?.trim() || null,
      prizeType,
      stockQuantity: prizeType === "badge" ? 0 : Number(stockQuantity) || 0,
      badgeId: prizeType === "badge" ? badgeId : null,
      isActive: 1,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
