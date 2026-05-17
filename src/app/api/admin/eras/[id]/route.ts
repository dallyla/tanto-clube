import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eras, type NewEra } from "@/db/schema/eras";
import { eraPrizePacks } from "@/db/schema/prizes";
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
  const [era] = await db.select().from(eras).where(eq(eras.id, id)).limit(1);
  if (!era) return NextResponse.json({ error: "Era não encontrada" }, { status: 404 });

  const packs = await db
    .select({ packId: eraPrizePacks.packId, positionFrom: eraPrizePacks.positionFrom, positionTo: eraPrizePacks.positionTo })
    .from(eraPrizePacks)
    .where(eq(eraPrizePacks.eraId, id))
    .orderBy(eraPrizePacks.positionFrom);

  return NextResponse.json({ ...era, prizePacks: packs });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;

  const [existing] = await db.select({ id: eras.id }).from(eras).where(eq(eras.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Era não encontrada" }, { status: 404 });

  const body = await req.json() as {
    name?: string;
    slug?: string;
    emoji?: string;
    tagline?: string | null;
    startsAt?: string;
    endsAt?: string;
    status?: "draft" | "scheduled" | "active" | "ended";
    focusAlbum?: string | null;
    focusTracks?: string[];
    baseMultiplier?: string;
    focusAlbumMultiplier?: string;
    focusTrackMultiplier?: string;
    prizePacks?: Array<{ packId: string; positionFrom: number; positionTo: number }>;
  };

  const updates: Partial<NewEra> & { updatedAt: Date } = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.emoji !== undefined) updates.emoji = body.emoji;
  if (body.tagline !== undefined) updates.tagline = body.tagline;
  if (body.startsAt !== undefined) updates.startsAt = new Date(body.startsAt);
  if (body.endsAt !== undefined) updates.endsAt = new Date(body.endsAt);
  if (body.status !== undefined) updates.status = body.status;
  if (body.focusAlbum !== undefined) updates.focusAlbum = body.focusAlbum;
  if (body.focusTracks !== undefined) updates.focusTracks = body.focusTracks;
  if (body.baseMultiplier !== undefined) updates.baseMultiplier = body.baseMultiplier;
  if (body.focusAlbumMultiplier !== undefined) updates.focusAlbumMultiplier = body.focusAlbumMultiplier;
  if (body.focusTrackMultiplier !== undefined) updates.focusTrackMultiplier = body.focusTrackMultiplier;

  const [updated] = await db.update(eras).set(updates).where(eq(eras.id, id)).returning();

  // Replace pack assignments if provided
  if (body.prizePacks !== undefined) {
    await db.delete(eraPrizePacks).where(eq(eraPrizePacks.eraId, id));
    if (body.prizePacks.length > 0) {
      await db.insert(eraPrizePacks).values(
        body.prizePacks.map((p) => ({ eraId: id, packId: p.packId, positionFrom: p.positionFrom, positionTo: p.positionTo }))
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
    .select({ status: eras.status })
    .from(eras)
    .where(eq(eras.id, id))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Era não encontrada" }, { status: 404 });
  if (existing.status === "active")
    return NextResponse.json({ error: "Não é possível deletar uma era ativa" }, { status: 400 });

  await db.delete(eras).where(eq(eras.id, id));
  return NextResponse.json({ success: true });
}
