import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { anonymousMode, emailEnabled, pushEnabled, themePreference } = body as {
    anonymousMode?: unknown;
    emailEnabled?: unknown;
    pushEnabled?: unknown;
    themePreference?: unknown;
  };

  const update: {
    anonymousMode?: boolean;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    themePreference?: string;
  } = {};

  if (anonymousMode !== undefined) update.anonymousMode = Boolean(anonymousMode);
  if (emailEnabled !== undefined) update.emailEnabled = Boolean(emailEnabled);
  if (pushEnabled !== undefined) update.pushEnabled = Boolean(pushEnabled);
  if (themePreference === "dark" || themePreference === "light") {
    update.themePreference = themePreference;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  await db.update(users).set(update).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
