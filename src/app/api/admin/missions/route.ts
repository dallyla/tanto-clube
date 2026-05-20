import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { missions } from "@/db/schema/missions";
import { notifications } from "@/db/schema/notifications";
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

export async function POST(req: NextRequest) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

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
  };

  if (!body.title?.trim() || !body.description?.trim() || !body.pointsReward) {
    return NextResponse.json(
      { error: "Campos obrigatórios: título, descrição e pontos" },
      { status: 400 }
    );
  }

  const [mission] = await db
    .insert(missions)
    .values({
      title: body.title.trim(),
      description: body.description.trim(),
      emoji: body.emoji?.trim() || "📋",
      pointsReward: body.pointsReward,
      requiresScreenshot: body.requiresScreenshot ?? true,
      eraId: body.eraId || null,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      isActive: body.isActive ?? true,
      maxCompletionsPerUser: body.maxCompletionsPerUser ?? 1,
      maxTotalCompletions: body.maxTotalCompletions ?? null,
    })
    .returning();

  if (mission.isActive) {
    const allUsers = await db.select({ id: users.id }).from(users);
    if (allUsers.length > 0) {
      await db.insert(notifications).values(
        allUsers.map((u) => ({
          userId: u.id,
          type: "mission_created" as const,
          title: `${mission.emoji} Nova missão: ${mission.title}!`,
          body: `Ganhe ${mission.pointsReward} pontos completando essa missão`,
          link: "/missoes",
        }))
      );
    }
  }

  return NextResponse.json(mission, { status: 201 });
}
