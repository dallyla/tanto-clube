import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { missions, missionSubmissions } from "@/db/schema/missions";
import { eq, and, or, isNull, lte, gte, inArray, desc } from "drizzle-orm";
import MissionCard from "./mission-card";
import type { MissionForCard, SubmissionForCard } from "./mission-card";

export const metadata: Metadata = { title: "Era" };
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

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function formatMult(raw: string) {
  const n = parseFloat(raw);
  return Number.isInteger(n) ? `×${n}` : `×${n.toFixed(1)}`;
}

const ERA_PRIZES = [
  { emoji: "🥇", title: "Top 1", desc: "Pack Premium + badge da Era" },
  { emoji: "🥈", title: "Top 2 & 3", desc: "Pack Normal + badge da Era" },
  { emoji: "🏅", title: "Top 4 a 30", desc: "Badges digitais exclusivas" },
] as const;

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

export default async function EraPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [era] = await db
    .select()
    .from(eras)
    .where(eq(eras.status, "active"))
    .limit(1);

  if (!era) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-4xl mb-4">🎯</p>
        <p className="font-display italic text-cream text-xl mb-2">Nenhuma era ativa</p>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          A próxima Era começa em breve. Fique ligado!
        </p>
      </div>
    );
  }

  const now = new Date();

  const activeMissions = await db
    .select({
      id: missions.id,
      title: missions.title,
      description: missions.description,
      pointsReward: missions.pointsReward,
      requiresScreenshot: missions.requiresScreenshot,
      maxCompletionsPerUser: missions.maxCompletionsPerUser,
    })
    .from(missions)
    .where(
      and(
        eq(missions.eraId, era.id),
        eq(missions.isActive, true),
        or(isNull(missions.startsAt), lte(missions.startsAt, now)),
        or(isNull(missions.endsAt), gte(missions.endsAt, now)),
      )
    );

  const missionIds = activeMissions.map((m) => m.id);

  const rawSubmissions =
    missionIds.length > 0
      ? await db
          .select({
            id: missionSubmissions.id,
            missionId: missionSubmissions.missionId,
            status: missionSubmissions.status,
            rejectionReason: missionSubmissions.rejectionReason,
            notes: missionSubmissions.notes,
          })
          .from(missionSubmissions)
          .where(
            and(
              eq(missionSubmissions.userId, session.user.id),
              inArray(missionSubmissions.missionId, missionIds),
            )
          )
          .orderBy(desc(missionSubmissions.submittedAt))
      : [];

  // Keep most-recent submission per mission
  const submissionMap = rawSubmissions.reduce(
    (acc, s) => {
      if (!acc.has(s.missionId)) acc.set(s.missionId, s);
      return acc;
    },
    new Map<string, SubmissionForCard>()
  );

  // Build active multiplier cards
  const multipliers: { tag: string; desc: string }[] = [];

  if (era.launchWindowEndsAt && era.launchWindowEndsAt > now) {
    const lw = parseFloat(era.launchWindowMultiplier);
    if (lw > 1) {
      multipliers.push({
        tag: formatMult(era.launchWindowMultiplier),
        desc: `Janela de lançamento (até ${formatDate(era.launchWindowEndsAt)})`,
      });
    }
  }

  const focusAlbumMult = parseFloat(era.focusAlbumMultiplier);
  if (focusAlbumMult > 1) {
    multipliers.push({
      tag: formatMult(era.focusAlbumMultiplier),
      desc: era.focusAlbum ? `Álbum em foco · ${era.focusAlbum}` : "Álbum em foco",
    });
  }

  const focusTrackMult = parseFloat(era.focusTrackMultiplier);
  if (focusTrackMult > 1 && era.focusTracks && era.focusTracks.length > 0) {
    multipliers.push({
      tag: formatMult(era.focusTrackMultiplier),
      desc: `Faixas em destaque (${era.focusTracks.length} música${era.focusTracks.length > 1 ? "s" : ""})`,
    });
  }

  const baseMultVal = parseFloat(era.baseMultiplier);
  if (baseMultVal > 1) {
    multipliers.push({
      tag: formatMult(era.baseMultiplier),
      desc: "Todos os scrobbles do artista",
    });
  }

  const progress = eraProgress(era.startsAt, era.endsAt);
  const countdown = eraCountdown(era.endsAt);
  const startLabel = formatDate(era.startsAt);
  const endLabel = formatDate(era.endsAt);

  return (
    <div className="flex flex-col gap-5">

      {/* Hero */}
      <div
        className="relative rounded-2xl p-7 overflow-hidden text-center"
        style={{
          background:
            "linear-gradient(135deg, rgb(196 49 75 / 0.12), rgb(200 164 92 / 0.08)), var(--color-bg-card)",
          border: "1px solid var(--color-border-strong)",
        }}
      >
        {/* glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-30px",
            right: "-30px",
            width: "160px",
            height: "160px",
            background: "radial-gradient(circle, rgb(200 164 92 / 0.2), transparent 70%)",
            borderRadius: "50%",
          }}
        />

        <p
          className="font-display italic text-xs tracking-widest uppercase mb-3 flex items-center justify-center gap-2"
          style={{ color: "var(--color-gold)", letterSpacing: "0.15em" }}
        >
          <span
            className="inline-block"
            style={{ width: "24px", height: "1px", background: "var(--color-gold)" }}
          />
          Era Atual · {startLabel} a {endLabel}
          <span
            className="inline-block"
            style={{ width: "24px", height: "1px", background: "var(--color-gold)" }}
          />
        </p>

        <h1
          className="font-display text-cream font-medium leading-none mb-2"
          style={{ fontSize: "2.8rem", letterSpacing: "-0.02em" }}
        >
          {era.name}
          <span className="ml-2 align-middle" style={{ fontSize: "2rem" }}>
            {era.emoji}
          </span>
        </h1>

        {era.tagline && (
          <p
            className="font-script text-cream text-xl inline-block mb-5"
            style={{ opacity: 0.85, transform: "rotate(-1deg)" }}
          >
            {era.tagline}
          </p>
        )}

        <div
          className="h-1 rounded-full overflow-hidden mt-4 mb-3"
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

        <p className="font-display italic text-cream text-sm">
          <strong
            className="not-italic font-medium"
            style={{ color: "var(--color-gold)" }}
          >
            {countdown}
          </strong>{" "}
          até a coroação
        </p>
      </div>

      {/* Multiplicadores */}
      {multipliers.length > 0 && (
        <div>
          <SectionHeading>multiplicadores ativos</SectionHeading>
          <div className="flex flex-col gap-2">
            {multipliers.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <span
                  className="font-display italic font-semibold text-sm px-3 py-1 rounded-lg flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-cherry-deep), var(--color-cherry))",
                    color: "var(--color-cream)",
                  }}
                >
                  {m.tag}
                </span>
                <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  {m.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missões */}
      <div>
        <SectionHeading>missões pontuais</SectionHeading>
        {activeMissions.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              Nenhuma missão ativa no momento.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeMissions.map((mission) => {
              const sub = submissionMap.get(mission.id) ?? null;
              return (
                <MissionCard
                  key={mission.id}
                  mission={mission as MissionForCard}
                  submission={sub}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Prêmios */}
      <div>
        <SectionHeading>prêmios da era</SectionHeading>
        <div className="flex flex-col gap-2">
          {ERA_PRIZES.map((p) => (
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

    </div>
  );
}
