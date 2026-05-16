import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eras } from "@/db/schema/eras";
import { events } from "@/db/schema/events";
import { pointsTransactions } from "@/db/schema/points";
import { eq, desc, gte, asc, sum } from "drizzle-orm";
import { formatPoints } from "@/lib/utils";
import { getFanLevel } from "@/lib/fan-level";

export const metadata: Metadata = { title: "Home" };
export const revalidate = 60;

function eraProgress(startsAt: Date, endsAt: Date) {
  const total = endsAt.getTime() - startsAt.getTime();
  const elapsed = Date.now() - startsAt.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function eraCountdown(endsAt: Date) {
  const diff = endsAt.getTime() - Date.now();
  if (diff <= 0) return "encerrada";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [user] = await db
    .select({
      totalPoints: users.totalPoints,
      currentStreak: users.currentStreak,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/login");

  const [era] = await db
    .select({
      id: eras.id,
      name: eras.name,
      emoji: eras.emoji,
      tagline: eras.tagline,
      startsAt: eras.startsAt,
      endsAt: eras.endsAt,
    })
    .from(eras)
    .where(eq(eras.status, "active"))
    .limit(1);

  const upcomingEvents = await db
    .select({ id: events.id, title: events.title, emoji: events.emoji, scheduledAt: events.scheduledAt })
    .from(events)
    .where(gte(events.scheduledAt, new Date()))
    .orderBy(asc(events.scheduledAt))
    .limit(3);

  const topFans = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarUrl: users.avatarUrl,
      totalPoints: users.totalPoints,
      anonymousMode: users.anonymousMode,
    })
    .from(users)
    .where(eq(users.isOnboarded, true))
    .orderBy(desc(users.totalPoints))
    .limit(50);

  const top3 = topFans.slice(0, 3);

  // Posição e pontos: usa era ativa se disponível, senão ranking geral
  let userRank = 0;
  let rankPoints = user.totalPoints;
  let rankLabel = "ranking geral";
  let top10MinPoints = topFans[9]?.totalPoints ?? 0;

  if (era) {
    const eraBoard = await db
      .select({
        userId: pointsTransactions.userId,
        eraPoints: sum(pointsTransactions.amount).mapWith(Number),
      })
      .from(pointsTransactions)
      .innerJoin(users, eq(pointsTransactions.userId, users.id))
      .where(eq(pointsTransactions.eraId, era.id))
      .groupBy(pointsTransactions.userId)
      .orderBy(desc(sum(pointsTransactions.amount)))
      .limit(200);

    const myEntry = eraBoard.find((r) => r.userId === session.user.id);
    userRank = eraBoard.findIndex((r) => r.userId === session.user.id) + 1;
    rankPoints = myEntry?.eraPoints ?? 0;
    rankLabel = `ranking · ${era.name}`;
    top10MinPoints = eraBoard[9]?.eraPoints ?? 0;
  } else {
    userRank = topFans.findIndex((f) => f.id === session.user.id) + 1;
  }

  const gapToTop10 =
    userRank > 10 ? Math.max(0, top10MinPoints - rankPoints + 1) : null;

  const { level, progress, pointsToNext } = getFanLevel(user.totalPoints);
  const nextLevelNames: Record<string, string> = {
    Iniciante: "Ouvinte",
    Ouvinte: "Fã",
    "Fã": "Superfã",
    Superfã: "Devoto",
    Devoto: "Top Fã",
  };
  const nextLevelName = nextLevelNames[level.name] ?? null;

  return (
    <div className="flex flex-col gap-4">

      {/* Era hero */}
      {era ? (
        <div
          className="relative rounded-2xl p-5 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgb(196 49 75 / 0.12), rgb(200 164 92 / 0.08)), var(--color-bg-card)",
            border: "1px solid var(--color-border-strong)",
          }}
        >
          {/* glow spot */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-30px", right: "-30px",
              width: "140px", height: "140px",
              background: "radial-gradient(circle, rgb(200 164 92 / 0.18), transparent 70%)",
              borderRadius: "50%",
            }}
          />

          <p
            className="font-display italic text-xs tracking-widest uppercase mb-1 flex items-center gap-2"
            style={{ color: "var(--color-gold)", letterSpacing: "0.15em" }}
          >
            <span
              className="inline-block"
              style={{ width: "24px", height: "1px", background: "var(--color-gold)" }}
            />
            Era I · em andamento
          </p>

          <h1 className="font-display text-cream text-3xl font-medium leading-none mb-1">
            {era.name}
            <span className="text-2xl ml-1 align-middle">{era.emoji}</span>
          </h1>

          {era.tagline && (
            <p className="font-script text-cream text-lg mb-4" style={{ opacity: 0.85 }}>
              {era.tagline}
            </p>
          )}

          <div className="flex items-center justify-between mb-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            <span>
              Termina em{" "}
              <strong className="font-display italic text-cream text-sm">
                {eraCountdown(era.endsAt)}
              </strong>
            </span>
            <span>{eraProgress(era.startsAt, era.endsAt)}%</span>
          </div>

          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgb(244 234 213 / 0.1)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${eraProgress(era.startsAt, era.endsAt)}%`,
                background: "linear-gradient(90deg, var(--color-cherry), var(--color-gold))",
              }}
            />
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Nenhuma era ativa no momento.
          </p>
        </div>
      )}

      {/* Posição */}
      {userRank > 0 && (
        <div
          className="rounded-2xl p-5 text-center relative"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="font-script text-gold text-lg mb-1">sua posição</p>
          <p
            className="font-display text-cream leading-none mb-2"
            style={{ fontSize: "4.5rem", fontWeight: 300, letterSpacing: "-0.03em" }}
          >
            <span className="text-gold" style={{ fontSize: "2.2rem", verticalAlign: "0.8em" }}>#</span>
            {userRank}
          </p>

          <p
            className="font-display italic text-xs uppercase tracking-widest"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            {rankLabel}
          </p>

          <div
            className="mt-4 pt-4"
            style={{ borderTop: "1px dashed var(--color-border)" }}
          >
            <p className="font-display italic text-cream text-2xl font-medium">
              {formatPoints(rankPoints)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              {era ? "pontos na era" : "pontos totais"}
            </p>
            {gapToTop10 !== null && (
              <p
                className="font-display italic text-xs mt-2"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Top 10 a{" "}
                <strong className="text-gold not-italic font-sans">
                  {formatPoints(gapToTop10)} pts
                </strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Streak */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="font-display italic text-xs tracking-widest uppercase"
            style={{ color: "var(--color-gold)" }}
          >
            manter a chama
          </span>
          <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
        </div>

        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{
              background: "rgb(196 49 75 / 0.15)",
              border: "1px solid rgb(196 49 75 / 0.3)",
            }}
          >
            🔥
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-cream text-sm font-medium">
              Streak: {user.currentStreak} {user.currentStreak === 1 ? "dia" : "dias"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              {user.currentStreak > 0 ? "Ouça hoje pra não perder" : "Ouça hoje para começar"}
            </p>
          </div>
          <span className="font-display italic text-gold text-sm">+50</span>
        </div>
      </div>

      {/* Próxima conquista */}
      {pointsToNext !== null && nextLevelName && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="font-display italic text-xs tracking-widest uppercase"
              style={{ color: "var(--color-gold)" }}
            >
              próxima conquista
            </span>
            <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
          </div>

          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{level.emoji}</span>
              <div className="flex-1">
                <p className="font-display italic text-cream font-medium">{nextLevelName}</p>
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {formatPoints(pointsToNext)} pts para o próximo nível
                </p>
              </div>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, var(--color-cherry), var(--color-gold))",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Vem aí */}
      {upcomingEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="font-display italic text-xs tracking-widest uppercase"
              style={{ color: "var(--color-gold)" }}
            >
              vem aí
            </span>
            <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            {upcomingEvents.map((ev, idx) => {
              const isLast = idx === upcomingEvents.length - 1;
              const diff = ev.scheduledAt.getTime() - Date.now();
              const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
              const dateLabel = ev.scheduledAt.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
              const countdown = daysUntil <= 0 ? "hoje" : daysUntil === 1 ? "amanhã" : `em ${daysUntil} dias`;

              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={!isLast ? { borderBottom: "1px dashed var(--color-border)" } : undefined}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, var(--color-cherry-deep), var(--color-cherry))",
                    }}
                  >
                    {ev.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm font-medium truncate">{ev.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                      {dateLabel} · {countdown}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Topo da era */}
      {top3.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="font-display italic text-xs tracking-widest uppercase"
              style={{ color: "var(--color-gold)" }}
            >
              topo da era
            </span>
            <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            {top3.map((fan, idx) => {
              const MEDALS = ["1", "2", "3"];
              const MEDAL_EMOJI = ["🥇", "🥈", "🥉"];
              const name = fan.anonymousMode ? "Anônimo" : fan.displayName;
              const emoji = fan.anonymousMode ? "🎭" : (fan.avatarEmoji ?? "🎵");
              const imgUrl = fan.anonymousMode ? null : (fan.avatarUrl ?? null);
              const isLast = idx === top3.length - 1;

              return (
                <div
                  key={fan.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={!isLast ? { borderBottom: "1px dashed var(--color-border)" } : undefined}
                >
                  <span className="w-7 text-center text-xl flex-shrink-0">{MEDAL_EMOJI[idx]}</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base leading-none flex-shrink-0 overflow-hidden"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      emoji
                    )}
                  </div>
                  <span className="flex-1 text-cream text-sm font-medium truncate">{name}</span>
                  <span className="font-display italic text-gold text-sm">
                    {formatPoints(fan.totalPoints)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
