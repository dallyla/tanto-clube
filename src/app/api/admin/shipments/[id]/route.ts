import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { prizeAwards, prizes } from "@/db/schema/prizes";
import { notifications } from "@/db/schema/notifications";
import { eq } from "drizzle-orm";

const VALID_STATUSES = ["pending_review", "approved", "address_pending", "shipped", "delivered", "cancelled"] as const;
type AwardStatus = typeof VALID_STATUSES[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [admin] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!admin || admin.role !== "admin")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { status?: string };

  if (!body.status || !(VALID_STATUSES as readonly string[]).includes(body.status))
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });

  const [existing] = await db
    .select({ id: prizeAwards.id, userId: prizeAwards.userId, prizeId: prizeAwards.prizeId, eraId: prizeAwards.eraId })
    .from(prizeAwards)
    .where(eq(prizeAwards.id, id))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 });

  const [updated] = await db
    .update(prizeAwards)
    .set({
      status: body.status as AwardStatus,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    })
    .where(eq(prizeAwards.id, id))
    .returning();

  if (body.status === "shipped" || body.status === "delivered") {
    const [prize] = await db.select({ name: prizes.name }).from(prizes).where(eq(prizes.id, existing.prizeId)).limit(1);
    const messages = {
      shipped: { title: "📦 Seu prêmio foi enviado!", body: `${prize?.name ?? "Seu prêmio"} está a caminho.` },
      delivered: { title: "✅ Seu prêmio chegou!", body: `${prize?.name ?? "Seu prêmio"} foi entregue. Aproveite!` },
    };
    const { title, body: notifBody } = messages[body.status as "shipped" | "delivered"];
    await db.insert(notifications).values({
      userId: existing.userId,
      type: "shipment_updated" as const,
      title,
      body: notifBody,
      link: existing.eraId ? `/resultado/${existing.eraId}` : null,
    });
  }

  return NextResponse.json(updated);
}
