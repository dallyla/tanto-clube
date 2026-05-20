import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { eq, desc, isNull, and, count } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;

  const [rows, [unreadRow]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(30),
    db
      .select({ unread: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
  ]);

  return NextResponse.json({ notifications: rows, unread: unreadRow?.unread ?? 0 });
}
