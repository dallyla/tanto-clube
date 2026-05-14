import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, scrobbles, pointsTransactions, eras, lastfmPollLog } from "@/db/schema";
import { and, asc, eq, isNotNull, lte, or, isNull } from "drizzle-orm";
import { getRecentTracks } from "@/lib/lastfm/client";
import { checkCaps } from "@/lib/anti-fraud/validators";
import { calculateScrobblePoints } from "@/lib/points/calculator";

// Validates the secret header set in cron-job.org
function validateCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const batchLimit = 10; // process up to 10 users per cron tick (stays within 10s Vercel timeout)

  // Find users due for polling: onboarded + lastfm connected + nextPollAt in the past
  const dueUsers = await db
    .select({ id: users.id, lastfmUsername: users.lastfmUsername, lastPollAt: users.lastPollAt })
    .from(users)
    .where(
      and(
        eq(users.isOnboarded, true),
        isNotNull(users.lastfmUsername),
        eq(users.isBanned, false),
        or(isNull(users.nextPollAt), lte(users.nextPollAt, now)),
      ),
    )
    .orderBy(asc(users.nextPollAt))
    .limit(batchLimit);

  if (dueUsers.length === 0) {
    return NextResponse.json({ processed: 0, message: "No users due for polling" });
  }

  // Get active era for multiplier calculations
  const [activeEra] = await db
    .select()
    .from(eras)
    .where(
      and(
        eq(eras.status, "active"),
        lte(eras.startsAt, now),
      ),
    )
    .limit(1);

  const results = await Promise.allSettled(
    dueUsers.map((user) =>
      processUserScrobbles(user.id, user.lastfmUsername!, user.lastPollAt, activeEra ?? null),
    ),
  );

  const summary = results.reduce(
    (acc, r) => ({
      success: acc.success + (r.status === "fulfilled" ? 1 : 0),
      failed: acc.failed + (r.status === "rejected" ? 1 : 0),
    }),
    { success: 0, failed: 0 },
  );

  return NextResponse.json({ processed: dueUsers.length, ...summary });
}

async function processUserScrobbles(
  userId: string,
  lastfmUsername: string,
  lastPollAt: Date | null,
  activeEra: typeof eras.$inferSelect | null,
) {
  const startTime = Date.now();
  let scrobblesFetched = 0;
  let scrobblesNew = 0;

  try {
    const fromTimestamp = lastPollAt
      ? Math.floor(lastPollAt.getTime() / 1000)
      : undefined;

    const { tracks, totalPages } = await getRecentTracks(lastfmUsername, fromTimestamp);
    scrobblesFetched = tracks.length;

    // Process all pages if needed (unlikely to exceed 200 in a 2h window)
    const allTracks = tracks;
    if (totalPages > 1) {
      for (let page = 2; page <= Math.min(totalPages, 3); page++) {
        const { tracks: moreTracks } = await getRecentTracks(lastfmUsername, fromTimestamp, page);
        allTracks.push(...moreTracks);
      }
    }

    // Sort chronologically to apply caps correctly
    allTracks.sort((a, b) => a.scrobbledAt.getTime() - b.scrobbledAt.getTime());

    const eraLimits = activeEra
      ? {
          maxHourlyScrobbles: activeEra.maxHourlyScrobbles,
          maxDailyFocusScrobbles: activeEra.maxDailyFocusScrobbles,
          maxDailyTotalScrobbles: activeEra.maxDailyTotalScrobbles,
        }
      : undefined;

    for (const track of allTracks) {
      const points = calculateScrobblePoints(track, activeEra);
      const capCheck = await checkCaps(userId, track.scrobbledAt, points.isFocusAlbum, eraLimits);

      const isCounted = capCheck.allowed;
      const pointsEarned = isCounted ? points.pointsEarned : 0;

      // Upsert scrobble (unique constraint handles dedup)
      await db
        .insert(scrobbles)
        .values({
          userId,
          eraId: activeEra?.id ?? null,
          lastfmTrackKey: track.trackKey,
          trackName: track.trackName,
          artistName: track.artistName,
          albumName: track.albumName,
          scrobbledAt: track.scrobbledAt,
          isFocusAlbum: points.isFocusAlbum,
          isFocusTrack: points.isFocusTrack,
          isCounted,
          capReason: capCheck.reason ?? null,
          rawPoints: points.rawPoints,
          pointsEarned,
        })
        .onConflictDoNothing(); // dedup index handles this

      if (isCounted && pointsEarned > 0) {
        await db.insert(pointsTransactions).values({
          userId,
          amount: pointsEarned,
          type: "scrobble",
          sourceId: undefined, // would be scrobble.id in a full implementation
          sourceType: "scrobble",
          description: `${track.trackName} — ${points.multiplierBreakdown}`,
          eraId: activeEra?.id ?? null,
        });

        // Increment denormalized total_points
        await db
          .update(users)
          .set({ totalPoints: db.$count(pointsTransactions, eq(pointsTransactions.userId, userId)) as unknown as number })
          .where(eq(users.id, userId));

        scrobblesNew++;
      }
    }

    // Update poll timestamps
    const nextPollHours = activeEra ? 1 : 2; // poll more frequently during active era
    const nextPollAt = new Date(Date.now() + nextPollHours * 60 * 60 * 1000);

    await db
      .update(users)
      .set({ lastPollAt: new Date(), nextPollAt })
      .where(eq(users.id, userId));

    await db.insert(lastfmPollLog).values({
      userId,
      scrobblesFetched,
      scrobblesNew,
      apiCallsMade: Math.min(totalPages ?? 1, 3) + 1,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    await db.insert(lastfmPollLog).values({
      userId,
      scrobblesFetched,
      scrobblesNew,
      errorMessage: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    throw error;
  }
}
