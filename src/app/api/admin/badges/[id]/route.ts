import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { badges } from "@/db/schema/badges";
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as {
    slug?: string;
    name?: string;
    description?: string;
    emoji?: string;
    category?: "volume" | "catalog" | "temporal" | "era" | "monthly_top" | "custom";
    criteriaType?: string;
    isSecret?: boolean;
    displayOrder?: number;
    eraId?: string | null;
  };

  const [updated] = await db
    .update(badges)
    .set({
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.criteriaType !== undefined && { criteriaType: body.criteriaType }),
      ...(body.isSecret !== undefined && { isSecret: body.isSecret }),
      ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
      ...(body.eraId !== undefined && { eraId: body.eraId }),
    })
    .where(eq(badges.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Badge não encontrado" }, { status: 404 });

  return NextResponse.json(updated);
}
