import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { auditLog } from "@/db/schema/audit";
import { eq } from "drizzle-orm";

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
  const body = await req.json() as { action: "ban" | "unban"; reason?: string };

  if (!body.action || !["ban", "unban"].includes(body.action))
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });

  // Fetch target user
  const [target] = await db
    .select({ id: users.id, isBanned: users.isBanned })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  if (body.action === "ban") {
    await db
      .update(users)
      .set({ isBanned: true, banReason: body.reason ?? null, updatedAt: new Date() })
      .where(eq(users.id, id));
  } else {
    await db
      .update(users)
      .set({ isBanned: false, banReason: null, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  await db.insert(auditLog).values({
    actorId: session.user.id,
    targetUserId: id,
    action: body.action === "ban" ? "user_banned" : "user_unbanned",
    entityType: "user",
    entityId: id,
    beforeState: { isBanned: target.isBanned },
    afterState: { isBanned: body.action === "ban", reason: body.reason ?? null },
  });

  return NextResponse.json({ success: true });
}
