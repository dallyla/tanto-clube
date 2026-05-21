import type { Metadata } from "next";
import Link from "next/link";
import { ScrobblesChart } from "./_components/scrobbles-chart";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { users } from "@/db/schema/users";
import { missionSubmissions } from "@/db/schema/missions";
import { prizeAwards, prizeShipments } from "@/db/schema/prizes";
import { scrobbles } from "@/db/schema/scrobbles";
import { eq, count, gte, and, isNull, lt, sql, asc } from "drizzle-orm";

export const metadata: Metadata = { title: "Dashboard" };
export const revalidate = 0;

function eraCountdown(endsAt: Date) {
  const diff = endsAt.getTime() - Date.now();
  if (diff <= 0) return "encerrada";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (minutes > 0) return `${minutes}min atrás`;
  return "agora";
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [activeEra] = await db
    .select()
    .from(eras)
    .where(eq(eras.status, "active"))
    .limit(1);

  const [{ total: totalFans }] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.isOnboarded, true));

  const [{ total: bannedCount }] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.isBanned, true));

  const [{ total: pendingMissions }] = await db
    .select({ total: count() })
    .from(missionSubmissions)
    .where(eq(missionSubmissions.status, "pending"));

  const [{ total: pendingShipments }] = await db
    .select({ total: count() })
    .from(prizeAwards)
    .innerJoin(prizeShipments, eq(prizeShipments.prizeAwardId, prizeAwards.id))
    .where(and(eq(prizeAwards.status, "approved"), isNull(prizeShipments.shippedAt)));

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ total: scrobblesThisMonth }] = await db
    .select({ total: count() })
    .from(scrobbles)
    .where(gte(scrobbles.scrobbledAt, monthStart));

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ total: newFansLast24h }] = await db
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.isOnboarded, true), gte(users.createdAt, last24h)));

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [{ total: scrobblesThisWeek }] = await db
    .select({ total: count() })
    .from(scrobbles)
    .where(gte(scrobbles.scrobbledAt, weekStart));

  const [{ total: scrobblesLastWeek }] = await db
    .select({ total: count() })
    .from(scrobbles)
    .where(and(gte(scrobbles.scrobbledAt, prevWeekStart), lt(scrobbles.scrobbledAt, weekStart)));

  const scrobblesWeekPct =
    scrobblesLastWeek > 0
      ? Math.round(((scrobblesThisWeek - scrobblesLastWeek) / scrobblesLastWeek) * 100)
      : null;

  // Daily scrobbles for current month (chart data)
  const rawDailyData = await db
    .select({
      day: sql<string>`${scrobbles.scrobbledAt}::date`,
      total: count(),
    })
    .from(scrobbles)
    .where(gte(scrobbles.scrobbledAt, monthStart))
    .groupBy(sql`${scrobbles.scrobbledAt}::date`)
    .orderBy(sql`${scrobbles.scrobbledAt}::date`);

  // Suspicious users: > 300 scrobbles in a single day in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const suspiciousRows = await db
    .select({ userId: scrobbles.userId })
    .from(scrobbles)
    .where(gte(scrobbles.scrobbledAt, thirtyDaysAgo))
    .groupBy(scrobbles.userId, sql`${scrobbles.scrobbledAt}::date`)
    .having(sql`count(*) > 300`);
  const suspiciousUserCount = new Set(suspiciousRows.map((r) => r.userId)).size;

  // Oldest pending mission submission
  const [oldestPending] = await db
    .select({ submittedAt: missionSubmissions.submittedAt })
    .from(missionSubmissions)
    .where(eq(missionSubmissions.status, "pending"))
    .orderBy(asc(missionSubmissions.submittedAt))
    .limit(1);

  // Next scheduled era
  const [nextEra] = await db
    .select()
    .from(eras)
    .where(eq(eras.status, "scheduled"))
    .orderBy(asc(eras.startsAt))
    .limit(1);

  // --- Build chart data ---
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const dailyMap = new Map<string, number>();
  for (const row of rawDailyData) {
    dailyMap.set(row.day, Number(row.total));
  }

  const dayData: number[] = [];
  for (let d = 1; d <= currentDay; d++) {
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dayData.push(dailyMap.get(key) ?? 0);
  }

  const maxCount = Math.max(...dayData, 1);
  const numDays = dayData.length;

  // Highlight day: era that started this month
  let highlightDay: number | null = null;
  if (activeEra) {
    const eraStart = activeEra.startsAt;
    if (eraStart.getFullYear() === currentYear && eraStart.getMonth() === currentMonth) {
      highlightDay = eraStart.getDate();
    }
  }

  const monthName = MONTH_NAMES[currentMonth];

  const hasAlerts = suspiciousUserCount > 0 || pendingMissions > 0 || !!nextEra;

  return (
    <div style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          className="font-display"
          style={{
            color: "var(--color-cream)",
            fontSize: "28px",
            fontWeight: 500,
            fontStyle: "italic",
            marginBottom: "4px",
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
          Visão geral do clube em tempo real
        </p>
      </div>

      {/* Active Era Card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(196,49,75,0.12), rgba(200,164,92,0.08)), var(--color-bg-card)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "120px",
            height: "120px",
            background: "radial-gradient(circle, rgba(200,164,92,0.18), transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        {activeEra ? (
          <>
            <p
              className="font-display"
              style={{
                color: "var(--color-gold)",
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontStyle: "italic",
                marginBottom: "8px",
              }}
            >
              Era Ativa
            </p>
            <h2
              className="font-display"
              style={{
                color: "var(--color-cream)",
                fontSize: "26px",
                fontWeight: 500,
                marginBottom: "4px",
              }}
            >
              {activeEra.emoji} {activeEra.name}
            </h2>
            {activeEra.tagline && (
              <p
                className="font-script"
                style={{ color: "var(--color-beige)", fontSize: "16px", marginBottom: "16px" }}
              >
                {activeEra.tagline}
              </p>
            )}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>Termina em</p>
                <p className="font-display" style={{ color: "var(--color-cream)", fontSize: "20px", fontStyle: "italic" }}>
                  {eraCountdown(activeEra.endsAt)}
                </p>
              </div>
              <div>
                <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>Início</p>
                <p style={{ color: "var(--color-cream)", fontSize: "14px" }}>{formatDate(activeEra.startsAt)}</p>
              </div>
              <div>
                <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>Encerramento</p>
                <p style={{ color: "var(--color-cream)", fontSize: "14px" }}>{formatDate(activeEra.endsAt)}</p>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <p style={{ color: "var(--color-muted-foreground)", marginBottom: "16px" }}>
              Nenhuma era ativa no momento.
            </p>
            <Link
              href="/admin/eras/new"
              style={{
                display: "inline-block",
                padding: "8px 20px",
                borderRadius: "8px",
                background: "var(--color-cherry)",
                color: "var(--color-cherry-fg)",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              + Criar nova era
            </Link>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            label: "Fãs cadastrados",
            value: totalFans.toString(),
            icon: "👥",
            href: "/admin/users",
            subtitle: newFansLast24h > 0 ? `+${newFansLast24h} nas últimas 24h` : null,
            subtitlePositive: true,
            alert: false,
          },
          {
            label: "Scrobbles este mês",
            value: scrobblesThisMonth.toLocaleString("pt-BR"),
            icon: "🎵",
            href: null,
            subtitle:
              scrobblesWeekPct !== null
                ? `${scrobblesWeekPct >= 0 ? "+" : ""}${scrobblesWeekPct}% vs semana anterior`
                : null,
            subtitlePositive: scrobblesWeekPct !== null && scrobblesWeekPct >= 0,
            alert: false,
          },
          {
            label: "Missões pendentes",
            value: pendingMissions.toString(),
            icon: "⏳",
            href: "/admin/missions",
            subtitle: null,
            subtitlePositive: false,
            alert: pendingMissions > 0,
          },
          {
            label: "Usuários banidos",
            value: bannedCount.toString(),
            icon: "🚫",
            href: "/admin/users",
            subtitle: null,
            subtitlePositive: false,
            alert: bannedCount > 0,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--color-bg-card)",
              border: stat.alert
                ? "1px solid rgba(196,49,75,0.4)"
                : "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "20px" }}>{stat.icon}</span>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>{stat.label}</p>
            </div>
            <p
              className="font-display"
              style={{
                color: stat.alert ? "var(--color-cherry)" : "var(--color-cream)",
                fontSize: "32px",
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1,
                marginBottom: stat.subtitle ? "6px" : "8px",
              }}
            >
              {stat.value}
            </p>
            {stat.subtitle && (
              <p
                style={{
                  fontSize: "12px",
                  color: stat.subtitlePositive ? "#6dcc8a" : "#e06060",
                  marginBottom: "8px",
                }}
              >
                {stat.subtitle}
              </p>
            )}
            {stat.href && (
              <Link
                href={stat.href}
                style={{ fontSize: "12px", color: "var(--color-gold)", textDecoration: "none" }}
              >
                ver detalhes →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Chart + Alerts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: hasAlerts ? "1fr 340px" : "1fr",
          gap: "16px",
          marginBottom: "24px",
          alignItems: "start",
        }}
      >
        {/* Scrobbles bar chart */}
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <p
            className="font-display"
            style={{
              color: "var(--color-cream)",
              fontSize: "14px",
              fontStyle: "italic",
              marginBottom: "16px",
            }}
          >
            🎧 Scrobbles por dia · {monthName}
          </p>

          <ScrobblesChart
            dayData={dayData}
            highlightDay={highlightDay}
            monthName={monthName}
            currentDay={currentDay}
          />
        </div>

        {/* Alerts */}
        {hasAlerts && (
          <div>
            <p
              className="font-display"
              style={{
                color: "var(--color-gold)",
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontStyle: "italic",
                marginBottom: "10px",
              }}
            >
              Alertas
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {suspiciousUserCount > 0 && (
                <div
                  style={{
                    background: "rgba(196,49,75,0.08)",
                    border: "1px solid rgba(196,49,75,0.25)",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "var(--color-cream)", fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
                      {suspiciousUserCount} {suspiciousUserCount === 1 ? "fã com padrão suspeito" : "fãs com padrão suspeito"}
                    </p>
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                      Picos de scrobble irregulares
                    </p>
                  </div>
                  <Link
                    href="/admin/users"
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      background: "var(--color-bg-card)",
                      border: "1px solid rgba(196,49,75,0.4)",
                      color: "var(--color-cream)",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Revisar
                  </Link>
                </div>
              )}

              {pendingMissions > 0 && (
                <div
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "18px", flexShrink: 0 }}>⏳</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "var(--color-cream)", fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
                      {pendingMissions} {pendingMissions === 1 ? "print aguardando validação" : "prints aguardando validação"}
                    </p>
                    {oldestPending && (
                      <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                        Mais antigos: {timeAgo(oldestPending.submittedAt)}
                      </p>
                    )}
                  </div>
                  <Link
                    href="/admin/missions"
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      background: "var(--color-gold)",
                      color: "#1a1008",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Validar
                  </Link>
                </div>
              )}

              {pendingShipments > 0 && (
                <div
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "18px", flexShrink: 0 }}>📦</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "var(--color-cream)", fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
                      {pendingShipments} {pendingShipments === 1 ? "endereço aguarda postagem" : "endereços aguardam postagem"}
                    </p>
                  </div>
                  <Link
                    href="/admin/shipments"
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      background: "var(--color-bg-card)",
                      border: "1px solid var(--color-border-strong)",
                      color: "var(--color-cream)",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Enviar
                  </Link>
                </div>
              )}

              {nextEra && (
                <div
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "18px", flexShrink: 0 }}>✓</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "var(--color-cream)", fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
                      {nextEra.emoji} {nextEra.name} pronta
                    </p>
                    <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                      Inicia em {daysUntil(nextEra.startsAt)} dias
                    </p>
                  </div>
                  <Link
                    href={`/admin/eras/${nextEra.id}/edit`}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      background: "var(--color-bg-card)",
                      border: "1px solid var(--color-border-strong)",
                      color: "var(--color-cream)",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Ver
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <p
          className="font-display"
          style={{
            color: "var(--color-gold)",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontStyle: "italic",
            marginBottom: "12px",
          }}
        >
          Ações rápidas
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { href: "/admin/missions", label: "Validar missões", primary: true },
            { href: "/admin/eras/new", label: "Nova era", primary: false },
            { href: "/admin/users", label: "Gerenciar fãs", primary: false },
            { href: "/admin/rankings", label: "Apuração", primary: false },
            { href: "/admin/shipments", label: "Envios pendentes", primary: false },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                background: action.primary ? "var(--color-cherry)" : "var(--color-bg-elevated)",
                border: action.primary ? "none" : "1px solid var(--color-border)",
                color: action.primary ? "var(--color-cherry-fg)" : "var(--color-cream)",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: action.primary ? 600 : 400,
              }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
