import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type))
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WEBP ou GIF" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "Imagem deve ter no máximo 2 MB" }, { status: 400 });

  const ext = file.type.split("/")[1];
  const blob = await put(`avatars/${session.user.id}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  await db.update(users).set({ avatarUrl: blob.url }).where(eq(users.id, session.user.id));

  return NextResponse.json({ url: blob.url });
}
