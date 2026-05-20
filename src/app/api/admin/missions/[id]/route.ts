import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { missions, type Mission } from "@/db/schema/missions";
import { notifications } from "@/db/schema/notifications";
import { eras } from "@/db/schema/eras";
import { eq } from "drizzle-orm";

async function getAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [admin] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  return admin?.role === "admin" ? session : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const [mission] = await db
    .select({
      id: missions.id,
      title: missions.title,
      description: missions.description,
      emoji: missions.emoji,
      pointsReward: missions.pointsReward,
      requiresScreenshot: missions.requiresScreenshot,
      eraId: missions.eraId,
      eraName: eras.name,
      startsAt: missions.startsAt,
      endsAt: missions.endsAt,
      isActive: missions.isActive,
      maxCompletionsPerUser: missions.maxCompletionsPerUser,
      maxTotalCompletions: missions.maxTotalCompletions,
    })
    .from(missions)
    .leftJoin(eras, eq(missions.eraId, eras.id))
    .where(eq(missions.id, id))
    .limit(1);

  if (!mission) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });
  return NextResponse.json(mission);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;

  const [existing] = await db
    .select({ id: missions.id, isActive: missions.isActive, title: missions.title, emoji: missions.emoji, pointsReward: missions.pointsReward })
    .from(missions)
    .where(eq(missions.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });

  const body = await req.json() as {
    title?: string;
    description?: string;
    emoji?: string;
    pointsReward?: number;
    requiresScreenshot?: boolean;
    eraId?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    isActive?: boolean;
    maxCompletionsPerUser?: number;
    maxTotalCompletions?: number | null;
    action?: "close" | "clone";
  };

  if (body.action === "close") {
    const [updated] = await db
      .update(missions)
      .set({ isActive: false, endsAt: new Date() })
      .where(eq(missions.id, id))
      .returning();

    const allUsers = await db.select({ id: users.id }).from(users).where(eq(users.isOnboarded, true));
    if (allUsers.length > 0) {
      await db.insert(notifications).values(
        allUsers.map((u) => ({
          userId: u.id,
          type: "mission_ended" as const,
          title: `${existing.emoji} Missão encerrada: ${existing.title}`,
          body: "Essa missão não aceita mais envios.",
          link: "/missoes",
        }))
      );
    }

    return NextResponse.json(updated);
  }

  if (body.action === "clone") {
    const [source] = await db
      .select()
      .from(missions)
      .where(eq(missions.id, id))
      .limit(1);
    if (!source) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });
    const [cloned] = await db
      .insert(missions)
      .values({
        title: `Cópia de ${source.title}`,
        description: source.description,
        emoji: source.emoji,
        pointsReward: source.pointsReward,
        requiresScreenshot: source.requiresScreenshot,
        eraId: source.eraId,
        maxCompletionsPerUser: source.maxCompletionsPerUser,
        maxTotalCompletions: source.maxTotalCompletions,
        isActive: false,
        startsAt: null,
        endsAt: null,
      })
      .returning();
    return NextResponse.json(cloned, { status: 201 });
  }

  const updates: Partial<Mission> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.emoji !== undefined) updates.emoji = body.emoji.trim() || "📋";
  if (body.pointsReward !== undefined) updates.pointsReward = body.pointsReward;
  if (body.requiresScreenshot !== undefined) updates.requiresScreenshot = body.requiresScreenshot;
  if (body.eraId !== undefined) updates.eraId = body.eraId || null;
  if (body.startsAt !== undefined) updates.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (body.endsAt !== undefined) updates.endsAt = body.endsAt ? new Date(body.endsAt) : null;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.maxCompletionsPerUser !== undefined) updates.maxCompletionsPerUser = body.maxCompletionsPerUser;
  if (body.maxTotalCompletions !== undefined) updates.maxTotalCompletions = body.maxTotalCompletions ?? null;

  const [updated] = await db
    .update(missions)
    .set(updates)
    .where(eq(missions.id, id))
    .returning();

  if (body.isActive === true && !existing.isActive) {
    const allUsers = await db.select({ id: users.id }).from(users);
    if (allUsers.length > 0) {
      await db.insert(notifications).values(
        allUsers.map((u) => ({
          userId: u.id,
          type: "mission_created" as const,
          title: `${updated.emoji} Nova missão: ${updated.title}!`,
          body: `Ganhe ${updated.pointsReward} pontos completando essa missão`,
          link: "/missoes",
        }))
      );
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;

  const [existing] = await db
    .select({ id: missions.id })
    .from(missions)
    .where(eq(missions.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });

  await db.delete(missions).where(eq(missions.id, id));
  return NextResponse.json({ ok: true });
}
