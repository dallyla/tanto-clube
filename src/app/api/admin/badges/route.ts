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

export async function POST(req: NextRequest) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json() as {
    slug: string;
    name: string;
    description: string;
    emoji: string;
    category: "volume" | "catalog" | "temporal" | "era" | "monthly_top" | "custom";
    criteriaType?: string;
    isSecret?: boolean;
    displayOrder?: number;
    eraId?: string | null;
  };

  if (!body.slug || !body.name || !body.description || !body.emoji || !body.category)
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });

  const [badge] = await db
    .insert(badges)
    .values({
      slug: body.slug,
      name: body.name,
      description: body.description,
      emoji: body.emoji,
      category: body.category,
      criteriaType: body.criteriaType ?? "manual",
      isSecret: body.isSecret ?? false,
      displayOrder: body.displayOrder ?? 0,
      eraId: body.eraId ?? null,
    })
    .returning();

  return NextResponse.json(badge, { status: 201 });
}
