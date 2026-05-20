import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { missions, missionSubmissions } from "@/db/schema/missions";
import { pointsTransactions } from "@/db/schema/points";
import { auditLog } from "@/db/schema/audit";
import { eq, sql } from "drizzle-orm";
import { notifications } from "@/db/schema/notifications";

export async function POST(
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
  const body = await req.json() as { action: "approve" | "reject"; reason?: string };

  if (!body.action || !["approve", "reject"].includes(body.action))
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });

  // Fetch submission + mission
  const [submission] = await db
    .select({
      id: missionSubmissions.id,
      userId: missionSubmissions.userId,
      missionId: missionSubmissions.missionId,
      status: missionSubmissions.status,
    })
    .from(missionSubmissions)
    .where(eq(missionSubmissions.id, id))
    .limit(1);

  if (!submission) return NextResponse.json({ error: "Envio não encontrado" }, { status: 404 });
  if (submission.status !== "pending")
    return NextResponse.json({ error: "Envio já foi revisado" }, { status: 400 });

  const [mission] = await db
    .select({
      id: missions.id,
      pointsReward: missions.pointsReward,
      eraId: missions.eraId,
      title: missions.title,
    })
    .from(missions)
    .where(eq(missions.id, submission.missionId))
    .limit(1);

  if (!mission) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });

  const now = new Date();

  if (body.action === "approve") {
    // Insert points transaction
    const [tx] = await db
      .insert(pointsTransactions)
      .values({
        userId: submission.userId,
        amount: mission.pointsReward,
        type: "mission",
        sourceId: submission.id,
        sourceType: "mission_submission",
        description: `Missão aprovada: ${mission.title}`,
        eraId: mission.eraId ?? undefined,
        createdBy: session.user.id,
      })
      .returning({ id: pointsTransactions.id });

    // Update user totalPoints
    await db
      .update(users)
      .set({ totalPoints: sql`${users.totalPoints} + ${mission.pointsReward}` })
      .where(eq(users.id, submission.userId));

    // Update submission
    await db
      .update(missionSubmissions)
      .set({
        status: "approved",
        reviewedBy: session.user.id,
        reviewedAt: now,
        pointsTransactionId: tx.id,
      })
      .where(eq(missionSubmissions.id, id));

    // Notify user
    await db.insert(notifications).values({
      userId: submission.userId,
      type: "mission_approved",
      title: "✅ Missão aprovada!",
      body: `Você ganhou ${mission.pointsReward} pts — ${mission.title}`,
      link: "/missoes",
    });
  } else {
    await db
      .update(missionSubmissions)
      .set({
        status: "rejected",
        reviewedBy: session.user.id,
        reviewedAt: now,
        rejectionReason: body.reason ?? null,
      })
      .where(eq(missionSubmissions.id, id));
  }

  // Audit log
  await db.insert(auditLog).values({
    actorId: session.user.id,
    targetUserId: submission.userId,
    action: body.action === "approve" ? "mission_approved" : "mission_rejected",
    entityType: "mission_submission",
    entityId: submission.id,
    afterState: { action: body.action, reason: body.reason ?? null },
  });

  return NextResponse.json({ success: true });
}
