import { db } from "@/db";
import { scrobbles } from "@/db/schema";
import { and, count, eq, gte, lt, sql } from "drizzle-orm";

export interface CapCheckResult {
  allowed: boolean;
  reason?: "hourly_cap" | "daily_focus_cap" | "daily_total_cap";
}

function startOfHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

interface EraLimits {
  maxHourlyScrobbles: number;
  maxDailyFocusScrobbles: number;
  maxDailyTotalScrobbles: number;
}

const GLOBAL_LIMITS: EraLimits = {
  maxHourlyScrobbles: 25,
  maxDailyFocusScrobbles: 150,
  maxDailyTotalScrobbles: 200,
};

export async function checkCaps(
  userId: string,
  scrobbledAt: Date,
  isFocusAlbum: boolean,
  limits: EraLimits = GLOBAL_LIMITS,
): Promise<CapCheckResult> {
  const hourStart = startOfHour(scrobbledAt);
  const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
  const dayStart = startOfDay(scrobbledAt);
  const dayEnd = endOfDay(scrobbledAt);

  const [hourlyCount] = await db
    .select({ count: count() })
    .from(scrobbles)
    .where(
      and(
        eq(scrobbles.userId, userId),
        eq(scrobbles.isCounted, true),
        gte(scrobbles.scrobbledAt, hourStart),
        lt(scrobbles.scrobbledAt, hourEnd),
      ),
    );

  if ((hourlyCount?.count ?? 0) >= limits.maxHourlyScrobbles) {
    return { allowed: false, reason: "hourly_cap" };
  }

  if (isFocusAlbum) {
    const [dailyFocusCount] = await db
      .select({ count: count() })
      .from(scrobbles)
      .where(
        and(
          eq(scrobbles.userId, userId),
          eq(scrobbles.isFocusAlbum, true),
          eq(scrobbles.isCounted, true),
          gte(scrobbles.scrobbledAt, dayStart),
          lt(scrobbles.scrobbledAt, dayEnd),
        ),
      );

    if ((dailyFocusCount?.count ?? 0) >= limits.maxDailyFocusScrobbles) {
      return { allowed: false, reason: "daily_focus_cap" };
    }
  }

  const [dailyTotalCount] = await db
    .select({ count: count() })
    .from(scrobbles)
    .where(
      and(
        eq(scrobbles.userId, userId),
        eq(scrobbles.isCounted, true),
        gte(scrobbles.scrobbledAt, dayStart),
        lt(scrobbles.scrobbledAt, dayEnd),
      ),
    );

  if ((dailyTotalCount?.count ?? 0) >= limits.maxDailyTotalScrobbles) {
    return { allowed: false, reason: "daily_total_cap" };
  }

  return { allowed: true };
}
