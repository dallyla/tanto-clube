import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { users } from "@/db/schema/users";
import { pointsTransactions } from "@/db/schema/points";
import { prizes, prizeAwards } from "@/db/schema/prizes";
import { eq, desc, sum, and, isNotNull } from "drizzle-orm";
import { WinnerCelebration } from "./winner-celebration";
import { AddressButtonClient } from "./address-button-client";

export const revalidate = 60;

type UserPrize = {
  prizeAwardId: string;
  prizeName: string;
  prizeType: string;
  isPhysical: boolean;
  status: string;
};

const PHYSICAL_TYPES = ["sticker", "mug", "poster", "other"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eraId: string }>;
}): Promise<Metadata> {
  const { eraId } = await params;
  const [era] = await db
    .select({ name: eras.name })
    .from(eras)
    .where(and(eq(eras.id, eraId), isNotNull(eras.announcedAt)))
    .limit(1);
  return { title: era ? `Resultado · ${era.name}` : "Resultado" };
}

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ eraId: string }>;
}) {
  const { eraId } = await params;

  const [era] = await db
    .select({
      id: eras.id,
      name: eras.name,
      emoji: eras.emoji,
      tagline: eras.tagline,
      endsAt: eras.endsAt,
      announcedAt: eras.announcedAt,
    })
    .from(eras)
    .where(and(eq(eras.id, eraId), isNotNull(eras.announcedAt)))
    .limit(1);

  if (!era) notFound();

  const leaderboard = await db
    .select({
      userId: pointsTransactions.userId,
      eraPoints: sum(pointsTransactions.amount).mapWith(Number),
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarUrl: users.avatarUrl,
      anonymousMode: users.anonymousMode,
    })
    .from(pointsTransactions)
    .innerJoin(users, eq(pointsTransactions.userId, users.id))
    .where(eq(pointsTransactions.eraId, eraId))
    .groupBy(
      pointsTransactions.userId,
      users.displayName,
      users.avatarEmoji,
      users.avatarUrl,
      users.anonymousMode,
    )
    .orderBy(desc(sum(pointsTransactions.amount)))
    .limit(100);

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;

  let userPrizes: UserPrize[] = [];
  let userRank = 0;

  if (userId) {
    userRank = leaderboard.findIndex((r) => r.userId === userId) + 1;

    const awards = await db
      .select({
        id: prizeAwards.id,
        status: prizeAwards.status,
        prizeName: prizes.name,
        prizeType: prizes.prizeType,
      })
      .from(prizeAwards)
      .innerJoin(prizes, eq(prizeAwards.prizeId, prizes.id))
      .where(and(eq(prizeAwards.userId, userId), eq(prizeAwards.eraId, eraId)));

    userPrizes = awards.map((a) => ({
      prizeAwardId: a.id,
      prizeName: a.prizeName,
      prizeType: a.prizeType,
      isPhysical: PHYSICAL_TYPES.includes(a.prizeType),
      status: a.status,
    }));
  }

  const MEDALS = ["🥇", "🥈", "🥉"];
  const hasPodium = userRank > 0 && userRank <= 3;

  const endsAtFormatted = era.endsAt.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">

      {hasPodium && (
        <WinnerCelebration
          rank={userRank}
          eraName={era.name}
          eraEmoji={era.emoji}
          prizes={userPrizes}
        />
      )}

      {/* Header */}
      <div
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgb(200 164 92 / 0.14), rgb(200 164 92 / 0.04)), var(--color-bg-card)",
          border: "1px solid rgba(200,164,92,0.4)",
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-30px", right: "-30px",
            width: "150px", height: "150px",
            background: "radial-gradient(circle, rgb(200 164 92 / 0.18), transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <p
          className="font-display italic text-xs tracking-widest uppercase mb-2 flex items-center gap-2"
          style={{ color: "var(--color-gold)", letterSpacing: "0.15em" }}
        >
          <span>🏆</span> Resultado oficial
        </p>
        <h1 className="font-display text-cream font-medium leading-none mb-1" style={{ fontSize: "2rem" }}>
          {era.emoji} {era.name}
        </h1>
        {era.tagline && (
          <p className="font-script text-lg" style={{ color: "var(--color-gold)", opacity: 0.9 }}>
            {era.tagline}
          </p>
        )}
        <p className="text-xs mt-2" style={{ color: "var(--color-muted-foreground)" }}>
          Encerrada em {endsAtFormatted} · {leaderboard.length} participantes
        </p>
      </div>

      {/* User position */}
      {userId && userRank > 0 && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: userPrizes.length > 0
              ? "linear-gradient(135deg, rgb(200 164 92 / 0.12), var(--color-bg-card))"
              : "var(--color-bg-card)",
            border: userPrizes.length > 0
              ? "1px solid rgba(200,164,92,0.35)"
              : "1px solid var(--color-border)",
          }}
        >
          <p className="font-script text-gold text-lg mb-1">sua posição final</p>
          <p
            className="font-display text-cream leading-none mb-2"
            style={{ fontSize: "4rem", fontWeight: 300, letterSpacing: "-0.03em" }}
          >
            <span className="text-gold" style={{ fontSize: "2rem", verticalAlign: "0.8em" }}>#</span>
            {userRank}
          </p>
          {userPrizes.length > 0 && (
            <div className="mt-3 flex flex-col items-center gap-1">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>
                🎁 seus prêmios
              </p>
              {userPrizes.map((p) => (
                <p key={p.prizeAwardId} className="text-cream text-sm font-medium">
                  {p.isPhysical ? "📦" : "✨"} {p.prizeName}
                </p>
              ))}
              <AddressButtonClient prizes={userPrizes} />
            </div>
          )}
        </div>
      )}

      {/* Podium */}
      {leaderboard.length >= 1 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-display italic text-xs tracking-widest uppercase" style={{ color: "var(--color-gold)" }}>
              pódio
            </span>
            <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
          </div>
          <div className="flex flex-col gap-2">
            {leaderboard.slice(0, 3).map((fan, idx) => {
              const medal = MEDALS[idx];
              const name = fan.anonymousMode ? "Anônimo" : fan.displayName;
              const emoji = fan.anonymousMode ? "🎭" : (fan.avatarEmoji ?? "🎵");
              const isCurrentUser = !!(userId && fan.userId === userId);

              return (
                <div
                  key={fan.userId}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: isCurrentUser
                      ? "rgba(200,164,92,0.12)"
                      : "var(--color-bg-card)",
                    border: isCurrentUser
                      ? "1px solid rgba(200,164,92,0.4)"
                      : "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontSize: "1.6rem", width: "32px", textAlign: "center", flexShrink: 0 }}>{medal}</span>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
                  >
                    {fan.avatarUrl && !fan.anonymousMode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fan.avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm font-semibold truncate">
                      {name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs font-normal" style={{ color: "var(--color-gold)" }}>você</span>
                      )}
                    </p>
                  </div>
                  <p className="font-display italic text-gold text-lg flex-shrink-0">
                    {(fan.eraPoints ?? 0).toLocaleString("pt-BR")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rest of ranking */}
      {leaderboard.length > 3 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-display italic text-xs tracking-widest uppercase" style={{ color: "var(--color-gold)" }}>
              ranking completo
            </span>
            <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            {leaderboard.slice(3).map((fan, idx) => {
              const rank = idx + 4;
              const name = fan.anonymousMode ? "Anônimo" : fan.displayName;
              const emoji = fan.anonymousMode ? "🎭" : (fan.avatarEmoji ?? "🎵");
              const isCurrentUser = !!(userId && fan.userId === userId);
              const isLast = idx === leaderboard.length - 4;

              return (
                <div
                  key={fan.userId}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom: !isLast ? "1px dashed var(--color-border)" : "none",
                    background: isCurrentUser ? "rgba(200,164,92,0.06)" : "transparent",
                  }}
                >
                  <span
                    className="text-sm flex-shrink-0"
                    style={{ width: "28px", textAlign: "center", color: "var(--color-muted-foreground)" }}
                  >
                    #{rank}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 overflow-hidden"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
                  >
                    {fan.avatarUrl && !fan.anonymousMode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fan.avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : emoji}
                  </div>
                  <span className="flex-1 text-cream text-sm truncate">
                    {name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs" style={{ color: "var(--color-gold)" }}>você</span>
                    )}
                  </span>
                  <span className="font-display italic text-gold text-sm flex-shrink-0">
                    {(fan.eraPoints ?? 0).toLocaleString("pt-BR")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Link
        href="/"
        className="text-center text-sm py-3"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        ← voltar para a home
      </Link>
    </div>
  );
}
