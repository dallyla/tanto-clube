import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eras } from "@/db/schema/eras";
import { desc, eq } from "drizzle-orm";
import { formatPoints } from "@/lib/utils";

export const metadata: Metadata = { title: "Ranking" };
export const revalidate = 60;

async function getActiveEra() {
  const [era] = await db
    .select({
      id: eras.id,
      name: eras.name,
      emoji: eras.emoji,
      tagline: eras.tagline,
      endsAt: eras.endsAt,
    })
    .from(eras)
    .where(eq(eras.status, "active"))
    .limit(1);
  return era ?? null;
}

async function getTopFans(limit = 50) {
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      totalPoints: users.totalPoints,
      currentStreak: users.currentStreak,
      anonymousMode: users.anonymousMode,
    })
    .from(users)
    .where(eq(users.isOnboarded, true))
    .orderBy(desc(users.totalPoints))
    .limit(limit);
}

function daysLeft(endsAt: Date) {
  const diff = endsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function RankingPage() {
  const [era, fans] = await Promise.all([getActiveEra(), getTopFans()]);

  return (
    <div className="flex flex-col gap-6">
      {era ? (
        <div className="bg-bg-card border border-[color:var(--color-border-strong)] rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-gold text-xs font-semibold uppercase tracking-widest mb-1">
                Era ativa
              </p>
              <h1 className="font-display text-cream text-2xl font-semibold">
                {era.emoji} {era.name}
              </h1>
              {era.tagline && (
                <p className="text-[color:var(--color-muted-foreground)] text-sm mt-1 leading-relaxed">
                  {era.tagline}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 bg-cherry/20 text-cherry text-xs font-bold px-2.5 py-1 rounded-full">
                ⏳ {daysLeft(era.endsAt)}d
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-5 text-center">
          <p className="text-[color:var(--color-muted-foreground)] text-sm">
            Nenhuma era ativa no momento.
          </p>
        </div>
      )}

      <div>
        <h2 className="font-display text-cream text-lg font-semibold mb-4">
          Top Fãs
        </h2>

        {fans.length === 0 ? (
          <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-10 text-center flex flex-col items-center gap-3">
            <span className="text-4xl">🎙️</span>
            <p className="text-cream font-medium">Ninguém no palco ainda.</p>
            <p className="text-[color:var(--color-muted-foreground)] text-sm">
              Seja o primeiro a entrar para o ranking!
            </p>
            <Link
              href="/login"
              className="mt-2 inline-block bg-gold text-bg-primary font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gold-bright transition-colors"
            >
              Entrar no clube
            </Link>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {fans.map((fan, idx) => {
              const rank = idx + 1;
              const name = fan.anonymousMode ? "Fã anônimo" : fan.displayName;
              const emoji = fan.anonymousMode ? "🎭" : (fan.avatarEmoji ?? "🎵");

              return (
                <li
                  key={fan.id}
                  className="
                    flex items-center gap-3 px-4 py-3.5
                    bg-bg-card hover:bg-bg-card-hover
                    border border-[color:var(--color-border)]
                    rounded-xl transition-colors
                  "
                >
                  <span className="w-7 text-center shrink-0">
                    {rank <= 3 ? (
                      <span className="text-xl">{MEDALS[rank - 1]}</span>
                    ) : (
                      <span className="text-[color:var(--color-muted-foreground)] text-sm font-mono">
                        {rank}
                      </span>
                    )}
                  </span>

                  <span className="text-2xl shrink-0">{emoji}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-cream font-medium text-sm truncate">{name}</p>
                    {fan.currentStreak > 0 && (
                      <p className="text-[color:var(--color-muted-foreground)] text-xs">
                        🔥 {fan.currentStreak} dias consecutivos
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-gold font-bold text-sm tabular-nums">
                      {formatPoints(fan.totalPoints)}
                    </p>
                    <p className="text-[color:var(--color-muted-foreground)] text-xs">pts</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="
            inline-block bg-cherry text-cream font-semibold text-sm
            px-6 py-3 rounded-xl
            hover:bg-cherry-deep transition-colors
          "
        >
          Entrar no clube ✨
        </Link>
      </div>
    </div>
  );
}
