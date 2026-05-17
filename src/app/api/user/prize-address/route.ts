import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { prizeAwards, prizeShipments } from "@/db/schema/prizes";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const addressSchema = z.object({
  prizeAwardId: z.string().uuid(),
  recipientName: z.string().min(2).max(120),
  address: z.object({
    street: z.string().min(4).max(200),
    number: z.string().min(1).max(20),
    complement: z.string().max(100).optional(),
    neighborhood: z.string().min(2).max(100),
    city: z.string().min(2).max(100),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  }),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });

  const { prizeAwardId, recipientName, address } = parsed.data;

  // Ensure this award belongs to this user and is in address_pending state
  const [award] = await db
    .select({ id: prizeAwards.id, status: prizeAwards.status, userId: prizeAwards.userId })
    .from(prizeAwards)
    .where(and(eq(prizeAwards.id, prizeAwardId), eq(prizeAwards.userId, session.user.id)))
    .limit(1);

  if (!award) return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 });
  if (award.status !== "address_pending")
    return NextResponse.json({ error: "Este prêmio não está aguardando endereço" }, { status: 400 });

  // Check for duplicate shipment
  const [existing] = await db
    .select({ id: prizeShipments.id })
    .from(prizeShipments)
    .where(eq(prizeShipments.prizeAwardId, prizeAwardId))
    .limit(1);

  if (existing) return NextResponse.json({ error: "Endereço já cadastrado" }, { status: 400 });

  await db.transaction(async (tx) => {
    await tx.insert(prizeShipments).values({
      prizeAwardId,
      recipientName,
      shippingAddress: address,
    });

    await tx
      .update(prizeAwards)
      .set({ status: "approved" })
      .where(eq(prizeAwards.id, prizeAwardId));
  });

  return NextResponse.json({ success: true });
}
