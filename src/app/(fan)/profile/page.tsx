import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { scrobbles } from "@/db/schema/scrobbles";
import { eq, and, count, gte, desc } from "drizzle-orm";
import { formatPoints } from "@/lib/utils";
import { getFanLevel } from "@/lib/fan-level";
import SignOutButton from "./sign-out-button";
import EditProfileModal from "./edit-profile-modal";
import LastfmStatus from "./lastfm-status";
import SettingsForm from "./settings-form";
import PointsInfoTooltip from "./points-info-tooltip";
import StreakInfoTooltip from "./streak-info-tooltip";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      avatarEmoji: users.avatarEmoji,
      lastfmUsername: users.lastfmUsername,
      totalPoints: users.totalPoints,
      currentStreak: users.currentStreak,
      longestStreak: users.longestStreak,
      createdAt: users.createdAt,
      lastPollAt: users.lastPollAt,
      nextPollAt: users.nextPollAt,
      anonymousMode: users.anonymousMode,
      emailEnabled: users.emailEnabled,
      pushEnabled: users.pushEnabled,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/login");

  const [focusResult] = await db
    .select({ value: count() })
    .from(scrobbles)
    .where(
      and(
        eq(scrobbles.userId, session.user.id),
        eq(scrobbles.isFocusAlbum, true),
        eq(scrobbles.isCounted, true),
      ),
    );

  const focusAlbumCount = focusResult?.value ?? 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [topTrackResult] = await db
    .select({ trackName: scrobbles.trackName, plays: count() })
    .from(scrobbles)
    .where(
      and(
        eq(scrobbles.userId, session.user.id),
        eq(scrobbles.isCounted, true),
        gte(scrobbles.scrobbledAt, startOfMonth),
      ),
    )
    .groupBy(scrobbles.trackName)
    .orderBy(desc(count()))
    .limit(1);

  const { level, progress, pointsToNext } = getFanLevel(user.totalPoints);

  const memberDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  const memberText =
    memberDays === 0
      ? "membro hoje"
      : memberDays === 1
        ? "membro há 1 dia"
        : `membro há ${memberDays} dias`;

  return (
    <div className="flex flex-col gap-5">

      {/* Cabeçalho centrado */}
      <div
        className="rounded-2xl p-6 text-center relative"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-strong)",
        }}
      >
        <EditProfileModal
          initialName={user.displayName}
          initialEmoji={user.avatarEmoji ?? "🎵"}
          initialAvatarUrl={user.avatarUrl}
        />
        {/* Avatar com anel tracejado */}
        <div className="relative inline-block mb-4">
          <div
            className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-4xl border-2 border-gold overflow-hidden"
            style={{ background: "linear-gradient(135deg, var(--color-cherry-deep), var(--color-cherry))" }}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.avatarEmoji ?? "🎵"
            )}
          </div>
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: "-7px",
              border: "1px dashed var(--color-gold-deep)",
              opacity: 0.55,
            }}
          />
        </div>

        {/* Nome */}
        <h1 className="font-display text-cream text-2xl font-medium italic tracking-tight leading-tight">
          {user.displayName}
        </h1>

        {/* Nível + tempo de membro */}
        <div className="flex items-center justify-center gap-2 mt-2 text-sm">
          <span className="text-cream">
            {level.emoji}{" "}
            <span className="text-gold font-semibold">{level.name}</span>
          </span>
          <span className="text-gold-deep">·</span>
          <span className="text-[color:var(--color-muted-foreground)]">{memberText}</span>
        </div>

        {/* Last.fm username */}
        {user.lastfmUsername && (
          <p className="text-[color:var(--color-muted-foreground)] text-xs mt-2">
            Last.fm:{" "}
            <span className="text-gold font-semibold">{user.lastfmUsername}</span>
          </p>
        )}
      </div>

      {/* Barra de progresso de nível */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-cream text-sm font-semibold">
            {level.emoji} <span className="text-gold">{level.name}</span>
          </span>
          {pointsToNext !== null ? (
            <span className="text-[color:var(--color-muted-foreground)] text-xs">
              {formatPoints(pointsToNext)} pts para{" "}
              <span className="text-gold">próximo</span>
            </span>
          ) : (
            <span className="text-gold font-semibold text-xs">Nível máximo 👑</span>
          )}
        </div>
        <p className="text-[color:var(--color-muted-foreground)] font-script text-sm mb-2">
          progressão de nível
        </p>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--color-cherry), var(--color-gold))",
            }}
          />
        </div>
      </div>

      {/* Stats 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Pontos */}
        <div
          className="rounded-xl p-4 text-center relative"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="absolute top-2 right-2">
            <PointsInfoTooltip />
          </div>
          <p className="font-display text-cream text-2xl font-medium italic tabular-nums leading-tight">
            {formatPoints(user.totalPoints)}
          </p>
          <p className="text-[color:var(--color-muted-foreground)] text-xs mt-1">pontos totais</p>
        </div>

        {/* Streak */}
        <div
          className="rounded-xl p-4 text-center relative"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="absolute top-2 right-2">
            <StreakInfoTooltip />
          </div>
          <p className="font-display text-cream text-2xl font-medium italic tabular-nums leading-tight">
            🔥 {user.currentStreak}
          </p>
          <p className="text-[color:var(--color-muted-foreground)] text-xs mt-1">streak atual</p>
        </div>

        {/* Álbum em foco */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="font-display text-cream text-2xl font-medium italic tabular-nums leading-tight">
            {formatPoints(focusAlbumCount)}
          </p>
          <p className="text-[color:var(--color-muted-foreground)] text-xs mt-1">do álbum em foco</p>
        </div>

        {/* Recorde */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="font-display text-cream text-2xl font-medium italic tabular-nums leading-tight">
            {user.longestStreak}
          </p>
          <p className="text-[color:var(--color-muted-foreground)] text-xs mt-1">recorde de streak</p>
        </div>
      </div>

      {/* Música favorita do mês */}
      {topTrackResult && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 divider-dashed" />
            <span className="text-[color:var(--color-muted-foreground)] text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">
              Música favorita
            </span>
            <div className="flex-1 divider-dashed" />
          </div>
          <div
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, var(--color-cherry-deep), var(--color-cherry))" }}
            >
              🎵
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-cream text-sm font-semibold truncate">{topTrackResult.trackName}</p>
              <p className="text-[color:var(--color-muted-foreground)] text-xs mt-0.5">
                {topTrackResult.plays} escuta{topTrackResult.plays !== 1 ? "s" : ""} neste mês
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conexão Last.fm */}
      {user.lastfmUsername && (
        <LastfmStatus
          lastfmUsername={user.lastfmUsername}
          lastPollAt={user.lastPollAt}
          nextPollAt={user.nextPollAt}
        />
      )}

      {/* Configurações */}
      <SettingsForm
        initialAnonymousMode={user.anonymousMode}
        initialEmailEnabled={user.emailEnabled}
        initialPushEnabled={user.pushEnabled}
      />

      {/* Sair */}
      <div className="pt-1">
        <SignOutButton />
      </div>
    </div>
  );
}
