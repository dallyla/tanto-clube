import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { formatPoints } from "@/lib/utils";
import SignOutButton from "./sign-out-button";
import ProfileEditForm from "./profile-edit-form";
import LastfmStatus from "./lastfm-status";
import SettingsForm from "./settings-form";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
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
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho do perfil */}
      <div className="bg-bg-card border border-[color:var(--color-border-strong)] rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{user.avatarEmoji ?? "🎵"}</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-cream text-2xl font-semibold truncate">
              {user.displayName}
            </h1>
            <p className="text-[color:var(--color-muted-foreground)] text-sm truncate">
              {user.email}
            </p>
            {user.lastfmUsername && (
              <p className="text-gold text-xs mt-1">
                Last.fm: <span className="font-semibold">{user.lastfmUsername}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-card border border-[color:var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-gold font-bold text-xl tabular-nums">
            {formatPoints(user.totalPoints)}
          </p>
          <p className="text-[color:var(--color-muted-foreground)] text-xs mt-1">pontos</p>
        </div>
        <div className="bg-bg-card border border-[color:var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-gold font-bold text-xl tabular-nums">
            {user.currentStreak}
          </p>
          <p className="text-[color:var(--color-muted-foreground)] text-xs mt-1">streak atual</p>
        </div>
        <div className="bg-bg-card border border-[color:var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-gold font-bold text-xl tabular-nums">
            {user.longestStreak}
          </p>
          <p className="text-[color:var(--color-muted-foreground)] text-xs mt-1">recorde</p>
        </div>
      </div>

      {/* Membro desde */}
      <p className="text-center text-[color:var(--color-muted-foreground)] text-xs">
        Membro desde{" "}
        {user.createdAt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
      </p>

      {/* Last.fm */}
      {user.lastfmUsername && (
        <LastfmStatus
          lastfmUsername={user.lastfmUsername}
          lastPollAt={user.lastPollAt}
          nextPollAt={user.nextPollAt}
        />
      )}

      {/* Editar perfil */}
      <ProfileEditForm
        initialName={user.displayName}
        initialEmoji={user.avatarEmoji ?? "🎵"}
      />

      {/* Configurações */}
      <SettingsForm
        initialAnonymousMode={user.anonymousMode}
        initialEmailEnabled={user.emailEnabled}
      />

      {/* Sair */}
      <div className="pt-2">
        <SignOutButton />
      </div>
    </div>
  );
}
