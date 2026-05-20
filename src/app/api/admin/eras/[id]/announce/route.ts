import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eras } from "@/db/schema/eras";
import { prizes, prizeAwards, prizePackItems, eraPrizePacks } from "@/db/schema/prizes";
import { userBadges } from "@/db/schema/badges";
import { pointsTransactions } from "@/db/schema/points";
import { eq, desc, sum, inArray, and } from "drizzle-orm";
import { notifications } from "@/db/schema/notifications";

async function getAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [u] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  return u?.role === "admin" ? session : null;
}

// POST /api/admin/eras/[id]/announce
// Sets announcedAt, creates prize awards for winners based on era's assigned packs
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;

  const [era] = await db
    .select({ id: eras.id, name: eras.name, status: eras.status, announcedAt: eras.announcedAt })
    .from(eras)
    .where(eq(eras.id, id))
    .limit(1);

  if (!era) return NextResponse.json({ error: "Era não encontrada" }, { status: 404 });
  if (era.status !== "ended")
    return NextResponse.json({ error: "Apenas eras encerradas podem ser anunciadas" }, { status: 400 });

  // Compute final leaderboard (top 30)
  const leaderboard = await db
    .select({
      userId: pointsTransactions.userId,
      eraPoints: sum(pointsTransactions.amount).mapWith(Number),
    })
    .from(pointsTransactions)
    .where(eq(pointsTransactions.eraId, id))
    .groupBy(pointsTransactions.userId)
    .orderBy(desc(sum(pointsTransactions.amount)))
    .limit(30);

  // Get pack assignments ordered by positionFrom
  const packAssignments = await db
    .select({
      packId: eraPrizePacks.packId,
      positionFrom: eraPrizePacks.positionFrom,
      positionTo: eraPrizePacks.positionTo,
    })
    .from(eraPrizePacks)
    .where(eq(eraPrizePacks.eraId, id))
    .orderBy(eraPrizePacks.positionFrom);

  const now = new Date();

  // Set announcedAt only if not already set
  if (!era.announcedAt) {
    await db.update(eras).set({ announcedAt: now, updatedAt: now }).where(eq(eras.id, id));
  }

  if (packAssignments.length === 0) {
    return NextResponse.json({ success: true, winnersNotified: 0 });
  }

  // Fetch items for all assigned packs
  const packIds = packAssignments.map((p) => p.packId);
  const allPackItems = await db
    .select({
      packId: prizePackItems.packId,
      prizeId: prizes.id,
      prizeType: prizes.prizeType,
      badgeId: prizes.badgeId,
      quantity: prizePackItems.quantity,
    })
    .from(prizePackItems)
    .innerJoin(prizes, eq(prizePackItems.prizeId, prizes.id))
    .where(inArray(prizePackItems.packId, packIds));

  const itemsByPack = new Map<
    string,
    Array<{ prizeId: string; prizeType: string; badgeId: string | null; quantity: number }>
  >();
  for (const item of allPackItems) {
    if (!itemsByPack.has(item.packId)) itemsByPack.set(item.packId, []);
    itemsByPack.get(item.packId)!.push({
      prizeId: item.prizeId,
      prizeType: item.prizeType,
      badgeId: item.badgeId,
      quantity: item.quantity,
    });
  }

  // Build award rows and collect badge grants in a single pass
  const awardsToCreate: (typeof prizeAwards.$inferInsert)[] = [];
  const badgeSeen = new Set<string>();
  const badgeGrantsToCreate: (typeof userBadges.$inferInsert)[] = [];

  for (const assignment of packAssignments) {
    const items = itemsByPack.get(assignment.packId) ?? [];
    if (items.length === 0) continue;

    for (let rank = assignment.positionFrom; rank <= assignment.positionTo; rank++) {
      const winner = leaderboard[rank - 1]; // rank is 1-indexed
      if (!winner) break;

      for (const item of items) {
        const isBadge = item.prizeType === "badge" && item.badgeId;
        const isDigital = item.prizeType === "digital";
        const initialStatus = isBadge
          ? ("delivered" as const)
          : isDigital
          ? ("pending_review" as const)
          : ("address_pending" as const);
        awardsToCreate.push({
          userId: winner.userId,
          prizeId: item.prizeId,
          eraId: id,
          awardedReason: `Top ${rank} · ${era.name}`,
          status: initialStatus,
          awardedAt: now,
        });

        if (isBadge && item.badgeId) {
          const key = `${winner.userId}:${item.badgeId}`;
          if (!badgeSeen.has(key)) {
            badgeSeen.add(key);
            badgeGrantsToCreate.push({
              userId: winner.userId,
              badgeId: item.badgeId,
              grantedReason: `Pack · ${era.name}`,
              earnedAt: now,
            });
          }
        }
      }
    }
  }

  // Skip awards that already exist for this era to keep the operation idempotent
  const existingAwards = awardsToCreate.length > 0
    ? await db
        .select({ userId: prizeAwards.userId, prizeId: prizeAwards.prizeId })
        .from(prizeAwards)
        .where(eq(prizeAwards.eraId, id))
    : [];

  const existingAwardSet = new Set(existingAwards.map((a) => `${a.userId}:${a.prizeId}`));
  const newAwards = awardsToCreate.filter((a) => !existingAwardSet.has(`${a.userId}:${a.prizeId}`));

  if (newAwards.length > 0) {
    await db.insert(prizeAwards).values(newAwards);
  }

  // Skip badge grants that already exist
  const badgeUserIds = badgeGrantsToCreate.map((b) => b.userId);
  const existingBadgeGrants = badgeGrantsToCreate.length > 0 && badgeUserIds.length > 0
    ? await db
        .select({ userId: userBadges.userId, badgeId: userBadges.badgeId })
        .from(userBadges)
        .where(and(
          inArray(userBadges.userId, badgeUserIds),
          inArray(userBadges.badgeId, badgeGrantsToCreate.map((b) => b.badgeId as string)),
        ))
    : [];

  const existingBadgeSet = new Set(existingBadgeGrants.map((b) => `${b.userId}:${b.badgeId}`));
  const newBadgeGrants = badgeGrantsToCreate.filter((b) => !existingBadgeSet.has(`${b.userId}:${b.badgeId}`));

  if (newBadgeGrants.length > 0) {
    await db.insert(userBadges).values(newBadgeGrants);
  }

  const uniqueWinnerIds = [...new Set(newAwards.map((a) => a.userId))];
  if (uniqueWinnerIds.length > 0) {
    await db.insert(notifications).values(
      uniqueWinnerIds.map((userId) => ({
        userId,
        type: "prize_awarded" as const,
        title: "🎁 Você ganhou um prêmio!",
        body: `Confira seus prêmios da era ${era.name}`,
        link: `/resultado/${id}`,
      }))
    );
  }

  return NextResponse.json({ success: true, winnersNotified: uniqueWinnerIds.length, newAwards: newAwards.length });
}
