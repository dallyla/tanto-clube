import { NextRequest, NextResponse } from "next/server";
import { getUserInfo, isAccountOldEnough } from "@/lib/lastfm/client";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const username: string | undefined = body?.username?.trim();

  if (!username) {
    return NextResponse.json({ error: "Usuário é obrigatório." }, { status: 400 });
  }

  let userInfo;
  try {
    userInfo = await getUserInfo(username);
  } catch {
    return NextResponse.json(
      { error: "Usuário não encontrado no Last.fm. Verifique o nome e tente novamente." },
      { status: 404 },
    );
  }

  if (!isAccountOldEnough(parseInt(userInfo.registered["#text"], 10))) {
    return NextResponse.json(
      {
        error:
          "Sua conta do Last.fm precisa ter pelo menos 7 dias para participar. " +
          "Volte em breve!",
      },
      { status: 422 },
    );
  }

  await db
    .update(users)
    .set({
      lastfmUsername: userInfo.name,
      lastfmRegisteredAt: new Date(parseInt(userInfo.registered["#text"], 10) * 1000),
      lastfmConnectedAt: new Date(),
      isOnboarded: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true, username: userInfo.name });
}
