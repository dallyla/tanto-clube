import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { missions, missionSubmissions } from "@/db/schema/missions";
import { eq, and } from "drizzle-orm";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { missionId } = await params;

  const [mission] = await db
    .select()
    .from(missions)
    .where(eq(missions.id, missionId))
    .limit(1);

  if (!mission) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });
  if (!mission.isActive) return NextResponse.json({ error: "Missão encerrada" }, { status: 400 });

  const now = new Date();
  if (mission.startsAt && mission.startsAt > now)
    return NextResponse.json({ error: "Missão ainda não começou" }, { status: 400 });
  if (mission.endsAt && mission.endsAt < now)
    return NextResponse.json({ error: "Missão encerrada" }, { status: 400 });

  const [existing] = await db
    .select({ id: missionSubmissions.id, status: missionSubmissions.status })
    .from(missionSubmissions)
    .where(
      and(
        eq(missionSubmissions.missionId, missionId),
        eq(missionSubmissions.userId, session.user.id),
      )
    )
    .limit(1);

  if (existing && existing.status !== "rejected")
    return NextResponse.json({ error: "Você já enviou essa missão" }, { status: 400 });

  const formData = await req.formData();
  const notes = (formData.get("notes") as string | null)?.trim() || null;
  let screenshotUrl: string | null = null;

  if (mission.requiresScreenshot) {
    const file = formData.get("screenshot") as File | null;
    if (!file || file.size === 0)
      return NextResponse.json({ error: "Screenshot obrigatório para esta missão" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type))
      return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WEBP" }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: "Imagem deve ter no máximo 5 MB" }, { status: 400 });

    const ext = file.type.split("/")[1];
    const blob = await put(
      `screenshots/missions/${missionId}/${session.user.id}-${Date.now()}.${ext}`,
      file,
      { access: "public", addRandomSuffix: false }
    );
    screenshotUrl = blob.url;
  }

  if (existing && existing.status === "rejected") {
    await db
      .update(missionSubmissions)
      .set({
        screenshotUrl,
        notes,
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        submittedAt: now,
      })
      .where(eq(missionSubmissions.id, existing.id));
  } else {
    await db.insert(missionSubmissions).values({
      missionId,
      userId: session.user.id,
      screenshotUrl,
      notes,
      status: "pending",
    });
  }

  return NextResponse.json({ success: true });
}
