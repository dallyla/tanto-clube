import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eras } from "@/db/schema/eras";
import { eq, desc } from "drizzle-orm";

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

export async function GET() {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const allEras = await db.select().from(eras).orderBy(desc(eras.startsAt));
  return NextResponse.json(allEras);
}

export async function POST(req: NextRequest) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json() as {
    name: string;
    slug: string;
    emoji: string;
    tagline?: string | null;
    startsAt: string;
    endsAt: string;
    status?: "draft" | "scheduled";
    focusAlbum?: string | null;
    focusTracks?: string[];
    baseMultiplier?: string;
    focusAlbumMultiplier?: string;
    focusTrackMultiplier?: string;
  };

  if (!body.name || !body.slug || !body.emoji || !body.startsAt || !body.endsAt)
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });

  const [era] = await db
    .insert(eras)
    .values({
      name: body.name,
      slug: body.slug,
      emoji: body.emoji,
      tagline: body.tagline ?? null,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      status: body.status ?? "draft",
      focusAlbum: body.focusAlbum ?? null,
      focusTracks: body.focusTracks ?? [],
      baseMultiplier: body.baseMultiplier ?? "1.00",
      focusAlbumMultiplier: body.focusAlbumMultiplier ?? "2.00",
      focusTrackMultiplier: body.focusTrackMultiplier ?? "3.00",
    })
    .returning();

  return NextResponse.json(era, { status: 201 });
}
