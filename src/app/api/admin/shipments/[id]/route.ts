import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { prizeAwards } from "@/db/schema/prizes";
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
    .select({ id: prizeAwards.id })
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

  return NextResponse.json(updated);
}
