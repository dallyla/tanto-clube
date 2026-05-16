"use server";

import { db } from "@/db";
import { users } from "@/db/schema/users";
import { scrobbles } from "@/db/schema/scrobbles";
import { pointsTransactions } from "@/db/schema/points";
import { eras } from "@/db/schema/eras";
import { and, desc, eq, gte, sum } from "drizzle-orm";
import type { Tab, RankedFan } from "./types";
import { PAGE_SIZE } from "./types";

export async function fetchRankingPage(
  tab: Tab,
  offset: number,
): Promise<{ fans: RankedFan[]; hasMore: boolean }> {
  const base = {
    id: users.id,
    displayName: users.displayName,
    avatarEmoji: users.avatarEmoji,
    avatarUrl: users.avatarUrl,
    anonymousMode: users.anonymousMode,
  };

  let fans: RankedFan[] = [];

  if (tab === "geral") {
    fans = await db
      .select({ ...base, points: users.totalPoints })
      .from(users)
      .where(eq(users.isOnboarded, true))
      .orderBy(desc(users.totalPoints))
      .limit(PAGE_SIZE + 1)
      .offset(offset);
  } else if (tab === "era") {
    const [activeEra] = await db
      .select({ id: eras.id })
      .from(eras)
      .where(eq(eras.status, "active"))
      .limit(1);

    if (activeEra) {
      const rows = await db
        .select({ ...base, points: sum(pointsTransactions.amount).mapWith(Number) })
        .from(pointsTransactions)
        .innerJoin(users, eq(pointsTransactions.userId, users.id))
        .where(and(eq(pointsTransactions.eraId, activeEra.id), eq(users.isOnboarded, true)))
        .groupBy(users.id)
        .orderBy(desc(sum(pointsTransactions.amount)))
        .limit(PAGE_SIZE + 1)
        .offset(offset);
      fans = rows.map((r) => ({ ...r, points: r.points ?? 0 }));
    }
  } else if (tab === "mes") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const rows = await db
      .select({ ...base, points: sum(pointsTransactions.amount).mapWith(Number) })
      .from(pointsTransactions)
      .innerJoin(users, eq(pointsTransactions.userId, users.id))
      .where(and(gte(pointsTransactions.createdAt, startOfMonth), eq(users.isOnboarded, true)))
      .groupBy(users.id)
      .orderBy(desc(sum(pointsTransactions.amount)))
      .limit(PAGE_SIZE + 1)
      .offset(offset);
    fans = rows.map((r) => ({ ...r, points: r.points ?? 0 }));
  } else {
    const rows = await db
      .select({ ...base, points: sum(scrobbles.pointsEarned).mapWith(Number) })
      .from(scrobbles)
      .innerJoin(users, eq(scrobbles.userId, users.id))
      .where(
        and(
          eq(scrobbles.isFocusAlbum, true),
          eq(scrobbles.isCounted, true),
          eq(users.isOnboarded, true),
        ),
      )
      .groupBy(users.id)
      .orderBy(desc(sum(scrobbles.pointsEarned)))
      .limit(PAGE_SIZE + 1)
      .offset(offset);
    fans = rows.map((r) => ({ ...r, points: r.points ?? 0 }));
  }

  const hasMore = fans.length > PAGE_SIZE;
  return { fans: fans.slice(0, PAGE_SIZE), hasMore };
}
