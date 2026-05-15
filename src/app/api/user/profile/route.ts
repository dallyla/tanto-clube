import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_EMOJIS = new Set([
  "🎵", "🎶", "🎸", "🎹", "🎺", "🎻", "🥁", "🎤", "🎧", "🎼",
  "🌟", "⭐", "🔥", "💫", "✨", "🎯", "🏆", "💎",
  "🦁", "🐺", "🦊", "🐉", "🌙", "☀️", "🌈",
]);

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { displayName, avatarEmoji } = body as { displayName?: unknown; avatarEmoji?: unknown };

  const update: { displayName?: string; avatarEmoji?: string; avatarUrl?: null } = {};

  if (displayName !== undefined) {
    const trimmed = String(displayName).trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      return NextResponse.json({ error: "Nome deve ter entre 1 e 50 caracteres" }, { status: 400 });
    }
    update.displayName = trimmed;
  }

  if (avatarEmoji !== undefined) {
    if (!ALLOWED_EMOJIS.has(String(avatarEmoji))) {
      return NextResponse.json({ error: "Emoji inválido" }, { status: 400 });
    }
    update.avatarEmoji = String(avatarEmoji);
    update.avatarUrl = null; // emoji overrides any uploaded image
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  await db.update(users).set(update).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
