import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { badges, userBadges } from "@/db/schema/badges";
import { prizes, prizeAwards } from "@/db/schema/prizes";
import { scrobbles } from "@/db/schema/scrobbles";
import { eq, and, count, countDistinct } from "drizzle-orm";
import { getFanLevel } from "@/lib/fan-level";
import { formatPoints } from "@/lib/utils";
import { checkAndAwardBadges } from "@/lib/badges/check-and-award";
import { BadgeGrid } from "./badge-grid";

export const metadata: Metadata = { title: "Prêmios & Badges" };
export const dynamic = "force-dynamic";

type CriteriaConfig = {
  type: "total_scrobbles" | "artist_scrobbles" | "streak_days" | "unique_tracks";
  threshold: number;
} | null;

const PRIZE_STATUS_LABEL: Record<string, string> = {
  pending_review: "aguardando revisão",
  approved: "aprovado",
  address_pending: "aguardando endereço",
  shipped: "enviado",
  delivered: "entregue",
  cancelled: "cancelado",
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="font-display italic text-xs tracking-widest uppercase"
        style={{ color: "var(--color-gold)" }}
      >
        {children}
      </span>
      <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
    </div>
  );
}

function BadgeProgress({
  criteria,
  totalScrobbles,
  artistScrobbles,
  currentStreak,
  uniqueTracks,
}: {
  criteria: CriteriaConfig;
  totalScrobbles: number;
  artistScrobbles: number;
  currentStreak: number;
  uniqueTracks: number;
}) {
  if (!criteria || !criteria.threshold) return null;

  let current = 0;
  let label = "";

  switch (criteria.type) {
    case "total_scrobbles":
      current = totalScrobbles;
      label = `${current.toLocaleString("pt-BR")}/${criteria.threshold.toLocaleString("pt-BR")} scrobbles totais`;
      break;
    case "artist_scrobbles":
      current = artistScrobbles;
      label = `${current.toLocaleString("pt-BR")}/${criteria.threshold.toLocaleString("pt-BR")} scrobbles do artista`;
      break;
    case "streak_days":
      current = currentStreak;
      label = `${current}/${criteria.threshold} dias consecutivos`;
      break;
    case "unique_tracks":
      current = uniqueTracks;
      label = `${current}/${criteria.threshold} músicas únicas`;
      break;
    default:
      return null;
  }

  const pct = Math.min(100, Math.round((current / criteria.threshold) * 100));

  return (
    <>
      <p className="text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
        {label}
      </p>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--color-cherry), var(--color-gold))",
          }}
        />
      </div>
    </>
  );
}

export default async function BadgesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  await checkAndAwardBadges(session.user.id);

  const [user] = await db
    .select({
      totalPoints: users.totalPoints,
      currentStreak: users.currentStreak,
      longestStreak: users.longestStreak,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/login");

  const [totalScrobblesRow] = await db
    .select({ count: count() })
    .from(scrobbles)
    .where(and(eq(scrobbles.userId, session.user.id), eq(scrobbles.isCounted, true)));

  const [artistScrobblesRow] = await db
    .select({ count: count() })
    .from(scrobbles)
    .where(and(eq(scrobbles.userId, session.user.id), eq(scrobbles.isCounted, true)));

  const [uniqueTracksRow] = await db
    .select({ count: countDistinct(scrobbles.lastfmTrackKey) })
    .from(scrobbles)
    .where(and(eq(scrobbles.userId, session.user.id), eq(scrobbles.isCounted, true)));

  const totalScrobbles = totalScrobblesRow?.count ?? 0;
  const artistScrobbles = artistScrobblesRow?.count ?? 0;
  const uniqueTracks = uniqueTracksRow?.count ?? 0;

  const allBadges = await db
    .select()
    .from(badges)
    .orderBy(badges.displayOrder);

  const earnedRows = await db
    .select({ badgeId: userBadges.badgeId, earnedAt: userBadges.earnedAt })
    .from(userBadges)
    .where(eq(userBadges.userId, session.user.id));

  const earnedSet = new Set(earnedRows.map((r) => r.badgeId));
  const earnedByBadgeId = new Map(earnedRows.map((r) => [r.badgeId, r.earnedAt]));

  const earnedBadges = allBadges.filter((b) => earnedSet.has(b.id) && !b.isSecret);
  const lockedBadges = allBadges.filter((b) => !earnedSet.has(b.id) && !b.isSecret);

  const userPrizeAwards = await db
    .select({
      id: prizeAwards.id,
      status: prizeAwards.status,
      awardedReason: prizeAwards.awardedReason,
      awardedAt: prizeAwards.awardedAt,
      prizeName: prizes.name,
      prizeDescription: prizes.description,
      prizeType: prizes.prizeType,
    })
    .from(prizeAwards)
    .innerJoin(prizes, eq(prizeAwards.prizeId, prizes.id))
    .where(eq(prizeAwards.userId, session.user.id))
    .orderBy(prizeAwards.awardedAt);

  const { level, progress, pointsToNext } = getFanLevel(user.totalPoints);

  const nextLevelNames: Record<string, string> = {
    Iniciante: "Ouvinte",
    Ouvinte: "Fã",
    Fã: "Superfã",
    Superfã: "Devoto",
    Devoto: "Top Fã",
  };
  const nextLevelName = nextLevelNames[level.name] ?? null;

  const prizeTypeEmoji: Record<string, string> = {
    sticker: "📦",
    mug: "☕",
    poster: "🖼️",
    digital: "🏅",
    other: "🎁",
  };

  const userStats = { totalScrobbles, artistScrobbles, currentStreak: user.currentStreak, uniqueTracks };

  return (
    <div className="flex flex-col gap-5">

      {/* Nível */}
      <div
        className="relative rounded-2xl px-5 py-6 text-center overflow-hidden"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, rgb(200 164 92 / 0.12), transparent 60%)",
          }}
        />
        <span className="font-script text-gold text-lg block mb-1 relative">seu nível</span>
        <p
          className="font-display italic text-cream font-medium relative"
          style={{ fontSize: "2.5rem", letterSpacing: "-0.01em" }}
        >
          <span className="mr-2" style={{ fontSize: "1.8rem", verticalAlign: "0.15em" }}>
            {level.emoji}
          </span>
          {level.name}
        </p>

        <div className="mt-4 relative">
          {pointsToNext !== null && nextLevelName ? (
            <>
              <p className="text-xs mb-1.5" style={{ color: "var(--color-muted-foreground)" }}>
                {progress}% até{" "}
                <em style={{ color: "var(--color-gold)" }}>{nextLevelName}</em>
                {" "}· faltam{" "}
                <strong className="not-italic font-medium" style={{ color: "var(--color-gold)" }}>
                  {formatPoints(pointsToNext)} pts
                </strong>
              </p>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "rgb(244 234 213 / 0.1)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, var(--color-cherry), var(--color-gold))",
                  }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs" style={{ color: "var(--color-gold)" }}>
              Nível máximo atingido 👑
            </p>
          )}
        </div>
      </div>

      {/* Badges conquistadas */}
      <div>
        <SectionHeading>
          {earnedBadges.length > 0
            ? `suas badges (${earnedBadges.length})`
            : "suas badges"}
        </SectionHeading>

        {earnedBadges.length === 0 && lockedBadges.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-3xl mb-2">🏅</p>
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              Suas badges aparecerão aqui conforme você progride.
            </p>
          </div>
        ) : (
          <BadgeGrid
            earnedBadges={earnedBadges.map((b) => ({
              id: b.id,
              name: b.name,
              description: b.description,
              emoji: b.emoji,
              earned: true,
            }))}
            lockedBadges={lockedBadges.map((b) => ({
              id: b.id,
              name: b.name,
              description: b.description,
              emoji: b.emoji,
              earned: false,
            }))}
          />
        )}
      </div>

      {/* Prêmios físicos */}
      {userPrizeAwards.length > 0 && (
        <div>
          <SectionHeading>seus prêmios</SectionHeading>
          <div className="flex flex-col gap-2.5">
            {userPrizeAwards.map((award) => (
              <div
                key={award.id}
                className="flex items-center gap-4 rounded-xl px-4 py-3"
                style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
              >
                <span className="text-3xl flex-shrink-0">
                  {prizeTypeEmoji[award.prizeType] ?? "🎁"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display italic text-cream font-medium truncate">
                    {award.prizeName}
                  </p>
                  {award.prizeDescription && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>
                      {award.prizeDescription}
                    </p>
                  )}
                  <p
                    className="font-display italic text-xs mt-1"
                    style={{ color: "var(--color-gold)" }}
                  >
                    {PRIZE_STATUS_LABEL[award.status] ?? award.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos prêmios (contextual) */}
      {userPrizeAwards.length === 0 && (
        <div>
          <SectionHeading>próximos prêmios</SectionHeading>
          <div className="flex flex-col gap-2.5">
            {[
              { emoji: "📦", title: "Pack Premium", desc: "Top 1 da Era · adesivos exclusivos + badge" },
              { emoji: "📬", title: "Pack Normal", desc: "Top 2 e 3 da Era · adesivos + badge" },
              { emoji: "☕", title: "Caneca do Mês", desc: "Top 1 mensal · única e irrepetível" },
            ].map((p) => (
              <div
                key={p.title}
                className="flex items-center gap-4 rounded-xl px-4 py-3"
                style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
              >
                <span className="text-3xl flex-shrink-0">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display italic text-cream font-medium">{p.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* A conquistar */}
      {lockedBadges.length > 0 && (
        <div>
          <SectionHeading>a conquistar</SectionHeading>
          <div className="flex flex-col gap-2.5">
            {lockedBadges
              .filter((b) => b.criteriaType === "automatic" && b.criteriaConfig !== null)
              .slice(0, 3)
              .map((badge) => {
                const criteria = badge.criteriaConfig as CriteriaConfig;
                return (
                  <div
                    key={badge.id}
                    className="rounded-xl px-4 py-3"
                    style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{
                          background: "var(--color-bg-elevated)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {badge.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display italic text-cream font-medium text-sm">
                          {badge.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                          {badge.description}
                        </p>
                      </div>
                    </div>
                    <BadgeProgress
                      criteria={criteria}
                      totalScrobbles={userStats.totalScrobbles}
                      artistScrobbles={userStats.artistScrobbles}
                      currentStreak={userStats.currentStreak}
                      uniqueTracks={userStats.uniqueTracks}
                    />
                  </div>
                );
              })}

            {/* Manual / era badges without criteria */}
            {lockedBadges
              .filter((b) => b.criteriaType !== "automatic" || b.criteriaConfig === null)
              .slice(0, 2)
              .map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      filter: "grayscale(1) opacity(0.5)",
                    }}
                  >
                    {badge.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-display italic font-medium text-sm"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      {badge.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)", opacity: 0.7 }}>
                      {badge.description}
                    </p>
                  </div>
                  {badge.isIrrecoverable && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: "rgb(196 49 75 / 0.15)",
                        color: "var(--color-cherry)",
                        border: "1px solid rgb(196 49 75 / 0.3)",
                      }}
                    >
                      irrecuperável
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty state if no badges in DB at all */}
      {allBadges.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-display italic text-cream text-xl mb-2">Badges a caminho</p>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            As badges serão liberadas em breve. Continue ouvindo!
          </p>
        </div>
      )}

    </div>
  );
}
