import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { missions, missionSubmissions } from "@/db/schema/missions";
import { users } from "@/db/schema/users";
import { eras } from "@/db/schema/eras";
import { eq, desc, sql } from "drizzle-orm";
import { MissionsReviewPanel } from "./missions-review";
import { EncerrarButton } from "./encerrar-button";
import { DeleteMissionButton } from "./delete-mission-button";
import { CloneMissionButton } from "./clone-mission-button";

export const metadata: Metadata = { title: "Missões" };
export const revalidate = 0;

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const SECTION_LABEL: React.CSSProperties = {
  color: "var(--color-gold)",
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontStyle: "italic",
  fontWeight: 600,
};

export default async function AdminMissionsPage() {
  await requireAdmin();

  const now = new Date();

  // Pending submissions for review panel
  const pending = await db
    .select({
      id: missionSubmissions.id,
      userId: missionSubmissions.userId,
      screenshotUrl: missionSubmissions.screenshotUrl,
      notes: missionSubmissions.notes,
      submittedAt: missionSubmissions.submittedAt,
      fanName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarUrl: users.avatarUrl,
      missionId: missionSubmissions.missionId,
      missionTitle: missions.title,
      pointsReward: missions.pointsReward,
    })
    .from(missionSubmissions)
    .innerJoin(users, eq(missionSubmissions.userId, users.id))
    .innerJoin(missions, eq(missionSubmissions.missionId, missions.id))
    .where(eq(missionSubmissions.status, "pending"))
    .orderBy(desc(missionSubmissions.submittedAt));

  // All missions
  const allMissions = await db
    .select({
      id: missions.id,
      title: missions.title,
      emoji: missions.emoji,
      description: missions.description,
      pointsReward: missions.pointsReward,
      isActive: missions.isActive,
      requiresScreenshot: missions.requiresScreenshot,
      eraId: missions.eraId,
      eraName: eras.name,
      startsAt: missions.startsAt,
      endsAt: missions.endsAt,
    })
    .from(missions)
    .leftJoin(eras, eq(missions.eraId, eras.id))
    .orderBy(desc(missions.createdAt));

  // Submission stats per mission
  const stats = await db
    .select({
      missionId: missionSubmissions.missionId,
      total: sql<number>`cast(count(*) as int)`,
      pendingCount: sql<number>`cast(count(*) filter (where ${missionSubmissions.status} = 'pending') as int)`,
      approvedCount: sql<number>`cast(count(*) filter (where ${missionSubmissions.status} = 'approved') as int)`,
    })
    .from(missionSubmissions)
    .groupBy(missionSubmissions.missionId);

  const statsMap = new Map(stats.map((s) => [s.missionId, s]));

  // Group missions — priority: encerrada > programada > ativa > rascunho
  const encerradas = allMissions.filter(
    (m) => m.endsAt && new Date(m.endsAt) <= now
  );
  const encerradasIds = new Set(encerradas.map((m) => m.id));
  const programadas = allMissions.filter(
    (m) => !encerradasIds.has(m.id) && m.startsAt && new Date(m.startsAt) > now
  );
  const programadasIds = new Set(programadas.map((m) => m.id));
  const ativas = allMissions.filter(
    (m) => !encerradasIds.has(m.id) && !programadasIds.has(m.id) && m.isActive
  );
  // Rascunhos: inactive missions that have not ended and have not been scheduled
  const rascunhos = allMissions.filter(
    (m) => !encerradasIds.has(m.id) && !programadasIds.has(m.id) && !m.isActive
  );

  const pendingForClient = pending.map((s) => ({
    ...s,
    avatarEmoji: s.avatarEmoji ?? "🎵",
    avatarUrl: s.avatarUrl ?? null,
    submittedAt: s.submittedAt,
  }));

  const totalPending = pending.length;

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
          gap: "16px",
        }}
      >
        <h1 className="font-display" style={{ fontSize: "28px", fontWeight: 700, fontStyle: "italic", lineHeight: 1.1 }}>
          <span style={{ color: "var(--color-gold)" }}>03. </span>
          <span style={{ color: "var(--color-cream)" }}>Missões Pontuais</span>
        </h1>
        <Link
          href="/admin/missions/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            borderRadius: "10px",
            background: "var(--color-gold)",
            color: "var(--color-bg-primary)",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          + Nova Missão
        </Link>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: "28px",
          alignItems: "start",
        }}
      >
        {/* ── Left: mission list ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* ATIVAS */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <p className="font-display" style={SECTION_LABEL}>
                Ativas · {ativas.length}
              </p>
              <div style={{ flex: 1, borderTop: "1px solid var(--color-border)" }} />
            </div>

            {ativas.length === 0 ? (
              <div
                style={{
                  padding: "28px",
                  borderRadius: "12px",
                  border: "1px dashed var(--color-border)",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
                  Nenhuma missão ativa no momento
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {ativas.map((m) => {
                  const s = statsMap.get(m.id);
                  const total = s?.total ?? 0;
                  const pendingCount = s?.pendingCount ?? 0;
                  const approvedCount = s?.approvedCount ?? 0;

                  return (
                    <div
                      key={m.id}
                      style={{
                        background: "var(--color-bg-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        padding: "16px 18px",
                      }}
                    >
                      {/* Row 1: emoji + title + pts */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <span style={{ fontSize: "18px", flexShrink: 0 }}>{m.emoji}</span>
                          <p
                            style={{
                              color: "var(--color-cream)",
                              fontSize: "14px",
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.title}
                          </p>
                        </div>
                        <span
                          className="font-display"
                          style={{
                            color: "var(--color-gold)",
                            fontSize: "14px",
                            fontWeight: 700,
                            fontStyle: "italic",
                            flexShrink: 0,
                          }}
                        >
                          +{m.pointsReward} pts
                        </span>
                      </div>

                      {/* Row 2: stats */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "12px",
                          fontSize: "12px",
                          marginBottom: "12px",
                          color: "var(--color-muted-foreground)",
                        }}
                      >
                        {m.eraName ? (
                          <span style={{ color: "var(--color-gold)", fontWeight: 600 }}>
                            🎭 {m.eraName}
                          </span>
                        ) : (
                          <span>🌐 sem era</span>
                        )}
                        <span>👥 {total} participações</span>
                        {pendingCount > 0 && (
                          <span style={{ color: "#d97706", fontWeight: 600 }}>
                            ⏳ {pendingCount} aguardando
                          </span>
                        )}
                        {approvedCount > 0 && m.requiresScreenshot && (
                          <span>✓ {approvedCount} validadas</span>
                        )}
                        {approvedCount > 0 && !m.requiresScreenshot && (
                          <span>✓ {approvedCount} automáticas</span>
                        )}
                        {m.endsAt && (
                          <span>🗓 termina {fmtDate(m.endsAt)}</span>
                        )}
                      </div>

                      {/* Row 3: actions */}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {pendingCount > 0 && (
                          <a href="#review-panel" style={{ textDecoration: "none" }}>
                            <button
                              style={{
                                padding: "7px 14px",
                                borderRadius: "7px",
                                background: "var(--color-gold)",
                                border: "none",
                                color: "var(--color-bg-primary)",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              Validar prints
                            </button>
                          </a>
                        )}
                        <Link
                          href={`/admin/missions/${m.id}/edit`}
                          style={{
                            display: "inline-block",
                            padding: "7px 14px",
                            borderRadius: "7px",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-cream)",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          Editar
                        </Link>
                        <CloneMissionButton missionId={m.id} />
                        <EncerrarButton missionId={m.id} missionTitle={m.title} />
                        <DeleteMissionButton missionId={m.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* PROGRAMADAS */}
          {programadas.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <p className="font-display" style={SECTION_LABEL}>
                  Programadas · {programadas.length}
                </p>
                <div style={{ flex: 1, borderTop: "1px solid var(--color-border)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {programadas.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "var(--color-bg-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      padding: "16px 18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <span style={{ fontSize: "18px", flexShrink: 0 }}>{m.emoji}</span>
                        <p
                          style={{
                            color: "var(--color-cream)",
                            fontSize: "14px",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {m.title}
                        </p>
                      </div>
                      <span
                        className="font-display"
                        style={{
                          color: "var(--color-gold)",
                          fontSize: "14px",
                          fontWeight: 700,
                          fontStyle: "italic",
                          flexShrink: 0,
                        }}
                      >
                        +{m.pointsReward} pts
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        fontSize: "12px",
                        color: "var(--color-muted-foreground)",
                        marginBottom: "12px",
                      }}
                    >
                      {m.eraName ? (
                        <span style={{ color: "var(--color-gold)", fontWeight: 600 }}>
                          🎭 {m.eraName}
                        </span>
                      ) : (
                        <span>🌐 sem era</span>
                      )}
                      {m.startsAt && (
                        <span>🗓 ativa em {fmtDate(m.startsAt)}</span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link
                        href={`/admin/missions/${m.id}/edit`}
                        style={{
                          display: "inline-block",
                          padding: "7px 14px",
                          borderRadius: "7px",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-cream)",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Editar
                      </Link>
                      <CloneMissionButton missionId={m.id} />
                      <DeleteMissionButton missionId={m.id} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* RASCUNHOS */}
          {rascunhos.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <p className="font-display" style={{ ...SECTION_LABEL, color: "var(--color-muted-foreground)" }}>
                  Rascunhos · {rascunhos.length}
                </p>
                <div style={{ flex: 1, borderTop: "1px solid var(--color-border)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {rascunhos.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "var(--color-bg-card)",
                      border: "1px dashed var(--color-border)",
                      borderRadius: "12px",
                      padding: "16px 18px",
                      opacity: 0.75,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <span style={{ fontSize: "18px", flexShrink: 0 }}>{m.emoji}</span>
                        <p style={{ color: "var(--color-cream)", fontSize: "14px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.title}
                        </p>
                      </div>
                      <span className="font-display" style={{ color: "var(--color-muted-foreground)", fontSize: "14px", fontWeight: 700, fontStyle: "italic", flexShrink: 0 }}>
                        +{m.pointsReward} pts
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)", marginBottom: "12px" }}>
                      {m.eraName ? (
                        <span style={{ color: "var(--color-gold)", fontWeight: 600 }}>🎭 {m.eraName}</span>
                      ) : (
                        <span>🌐 sem era</span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link
                        href={`/admin/missions/${m.id}/edit`}
                        style={{ display: "inline-block", padding: "7px 14px", borderRadius: "7px", border: "1px solid var(--color-border)", color: "var(--color-cream)", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                      >
                        Editar
                      </Link>
                      <CloneMissionButton missionId={m.id} />
                      <DeleteMissionButton missionId={m.id} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ENCERRADAS */}
          {encerradas.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <p className="font-display" style={{ ...SECTION_LABEL, color: "var(--color-muted-foreground)" }}>
                  Encerradas · {encerradas.length}
                </p>
                <div style={{ flex: 1, borderTop: "1px solid var(--color-border)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {encerradas.map((m) => {
                  const s = statsMap.get(m.id);
                  const approvedCount = s?.approvedCount ?? 0;
                  const total = s?.total ?? 0;
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: "var(--color-bg-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        padding: "16px 18px",
                        opacity: 0.65,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <span style={{ fontSize: "18px", flexShrink: 0 }}>{m.emoji}</span>
                          <p style={{ color: "var(--color-cream)", fontSize: "14px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.title}
                          </p>
                        </div>
                        <span className="font-display" style={{ color: "var(--color-muted-foreground)", fontSize: "14px", fontWeight: 700, fontStyle: "italic", flexShrink: 0 }}>
                          +{m.pointsReward} pts
                        </span>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "var(--color-muted-foreground)", marginBottom: "12px" }}>
                        {m.eraName ? (
                          <span style={{ color: "var(--color-gold)", fontWeight: 600 }}>🎭 {m.eraName}</span>
                        ) : (
                          <span>🌐 sem era</span>
                        )}
                        <span>👥 {total} participações</span>
                        {approvedCount > 0 && <span>✓ {approvedCount} aprovadas</span>}
                        {m.endsAt && <span>🗓 encerrada em {fmtDate(m.endsAt)}</span>}
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <CloneMissionButton missionId={m.id} />
                        <DeleteMissionButton missionId={m.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── Right: review panel (sticky) ── */}
        <div id="review-panel" style={{ position: "sticky", top: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <p className="font-display" style={SECTION_LABEL}>
              Validar Prints
            </p>
            {totalPending > 0 && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "99px",
                  background: "var(--color-cherry)",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {totalPending}
              </span>
            )}
            <div style={{ flex: 1, borderTop: "1px solid var(--color-border)" }} />
          </div>
          <MissionsReviewPanel submissions={pendingForClient} />
        </div>
      </div>
    </div>
  );
}
