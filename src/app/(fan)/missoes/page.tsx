import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { missions, missionSubmissions } from "@/db/schema/missions";
import { eras } from "@/db/schema/eras";
import { eq, desc, and, inArray } from "drizzle-orm";

export const metadata: Metadata = { title: "Missões" };
export const revalidate = 60;

export default async function MissoesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const allMissions = await db
    .select({
      id: missions.id,
      title: missions.title,
      emoji: missions.emoji,
      pointsReward: missions.pointsReward,
      isActive: missions.isActive,
      endsAt: missions.endsAt,
      createdAt: missions.createdAt,
      eraName: eras.name,
      eraEmoji: eras.emoji,
    })
    .from(missions)
    .leftJoin(eras, eq(missions.eraId, eras.id))
    .orderBy(desc(missions.createdAt));

  const missionIds = allMissions.map((m) => m.id);

  const userSubmissions =
    missionIds.length > 0
      ? await db
          .select({
            missionId: missionSubmissions.missionId,
            status: missionSubmissions.status,
          })
          .from(missionSubmissions)
          .where(
            and(
              eq(missionSubmissions.userId, session.user.id),
              inArray(missionSubmissions.missionId, missionIds)
            )
          )
      : [];

  const submissionMap = new Map<string, "pending" | "approved" | "rejected">();
  for (const s of userSubmissions) {
    const cur = submissionMap.get(s.missionId);
    if (!cur || s.status === "approved" || (s.status === "pending" && cur === "rejected")) {
      submissionMap.set(s.missionId, s.status);
    }
  }

  const now = Date.now();
  const cutoff24h = now - 24 * 60 * 60 * 1000;

  function missionState(m: typeof allMissions[number]) {
    const sub = submissionMap.get(m.id);
    if (sub === "approved") return "aprovada";
    if (sub === "pending") return "pendente";
    if (sub === "rejected") return "rejeitada";
    const ended = m.endsAt && m.endsAt.getTime() < now;
    if (!m.isActive || ended) return "encerrada";
    return "disponível";
  }

  const completed = allMissions.filter((m) => missionState(m) === "aprovada");
  const pending = allMissions.filter((m) => missionState(m) === "pendente");
  const available = allMissions.filter((m) => missionState(m) === "disponível");
  const rejected = allMissions.filter((m) => missionState(m) === "rejeitada");
  const ended = allMissions.filter((m) => missionState(m) === "encerrada");

  const sections = [
    { label: "disponíveis", items: available },
    { label: "aguardando validação", items: pending },
    { label: "feitas", items: completed },
    { label: "rejeitadas", items: rejected },
    { label: "encerradas", items: ended },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p
          className="font-display italic text-xs tracking-widest uppercase mb-1"
          style={{ color: "var(--color-gold)", letterSpacing: "0.15em" }}
        >
          🎯 missões
        </p>
        <h1 className="font-display text-cream font-medium" style={{ fontSize: "1.75rem" }}>
          Histórico de missões
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          {allMissions.length} {allMissions.length === 1 ? "missão no total" : "missões no total"}
        </p>
      </div>

      {allMissions.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Nenhuma missão ainda.
          </p>
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.label}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="font-display italic text-xs tracking-widest uppercase"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {section.label}
              </span>
              <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
              <span
                className="text-xs"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {section.items.length}
              </span>
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
            >
              {section.items.map((m, idx) => {
                const state = missionState(m);
                const isLast = idx === section.items.length - 1;
                const recentlyEnded =
                  state === "encerrada" &&
                  m.endsAt &&
                  m.endsAt.getTime() >= cutoff24h;

                return (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 px-4 py-3"
                    style={!isLast ? { borderBottom: "1px dashed var(--color-border)" } : undefined}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: state === "aprovada"
                          ? "rgb(200 164 92 / 0.15)"
                          : "var(--color-bg-elevated)",
                        border: state === "aprovada"
                          ? "1px solid rgb(200 164 92 / 0.4)"
                          : "1px solid var(--color-border)",
                        opacity: state === "encerrada" ? 0.5 : 1,
                      }}
                    >
                      {m.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: state === "aprovada" || state === "encerrada"
                            ? "var(--color-muted-foreground)"
                            : "var(--color-cream)",
                          textDecoration: state === "aprovada" ? "line-through" : undefined,
                        }}
                      >
                        {m.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {m.eraName ? (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: "99px",
                              background: "rgb(200 164 92 / 0.12)",
                              border: "1px solid rgb(200 164 92 / 0.35)",
                              color: "var(--color-gold)",
                            }}
                          >
                            🎭 {m.eraName}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 500,
                              padding: "2px 7px",
                              borderRadius: "99px",
                              background: "var(--color-bg-elevated)",
                              border: "1px solid var(--color-border)",
                              color: "var(--color-muted-foreground)",
                            }}
                          >
                            🌐 sem era
                          </span>
                        )}
                        {recentlyEnded && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 500,
                              padding: "2px 7px",
                              borderRadius: "99px",
                              background: "rgb(217 119 6 / 0.1)",
                              border: "1px solid rgb(217 119 6 / 0.25)",
                              color: "#d97706",
                            }}
                          >
                            encerrada recentemente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span
                        className="font-display italic text-sm"
                        style={{
                          color: state === "aprovada"
                            ? "var(--color-gold)"
                            : "var(--color-muted-foreground)",
                        }}
                      >
                        +{m.pointsReward}
                      </span>
                      {state === "aprovada" && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgb(200 164 92 / 0.12)",
                            border: "1px solid rgb(200 164 92 / 0.3)",
                            color: "var(--color-gold)",
                          }}
                        >
                          ✓ feita
                        </span>
                      )}
                      {state === "pendente" && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgb(217 119 6 / 0.12)",
                            border: "1px solid rgb(217 119 6 / 0.3)",
                            color: "#d97706",
                          }}
                        >
                          pendente
                        </span>
                      )}
                      {state === "rejeitada" && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgb(196 49 75 / 0.12)",
                            border: "1px solid rgb(196 49 75 / 0.3)",
                            color: "var(--color-cherry)",
                          }}
                        >
                          rejeitada
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
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
