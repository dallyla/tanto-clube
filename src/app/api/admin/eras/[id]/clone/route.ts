import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const [source] = await db.select().from(eras).where(eq(eras.id, id)).limit(1);
  if (!source) return NextResponse.json({ error: "Era não encontrada" }, { status: 404 });

  // Build a unique slug using a timestamp suffix
  const slug = `${source.slug}-copia-${Date.now()}`;

  const [cloned] = await db
    .insert(eras)
    .values({
      name: `${source.name} (cópia)`,
      slug,
      emoji: source.emoji,
      tagline: source.tagline,
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      status: "draft",
      focusAlbum: source.focusAlbum,
      focusTracks: source.focusTracks ?? [],
      artistName: source.artistName,
      baseMultiplier: source.baseMultiplier,
      focusAlbumMultiplier: source.focusAlbumMultiplier,
      focusTrackMultiplier: source.focusTrackMultiplier,
      launchWindowMultiplier: source.launchWindowMultiplier,
      launchWindowEndsAt: source.launchWindowEndsAt,
      maxDailyFocusScrobbles: source.maxDailyFocusScrobbles,
      maxDailyTotalScrobbles: source.maxDailyTotalScrobbles,
      maxHourlyScrobbles: source.maxHourlyScrobbles,
    })
    .returning();

  return NextResponse.json(cloned, { status: 201 });
}
