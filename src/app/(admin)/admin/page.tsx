import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { users } from "@/db/schema/users";
import { missionSubmissions } from "@/db/schema/missions";
import { prizeAwards, prizeShipments } from "@/db/schema/prizes";
import { scrobbles } from "@/db/schema/scrobbles";
import { eq, count, gte, and, isNull } from "drizzle-orm";

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
                color: "var(--color-cream)",
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
          { label: "Fãs cadastrados", value: totalFans.toString(), icon: "👥", href: "/admin/users" },
          { label: "Scrobbles este mês", value: scrobblesThisMonth.toString(), icon: "🎵", href: null },
          { label: "Missões pendentes", value: pendingMissions.toString(), icon: "⏳", href: "/admin/missions", alert: pendingMissions > 0 },
          { label: "Usuários banidos", value: bannedCount.toString(), icon: "🚫", href: "/admin/users", alert: bannedCount > 0 },
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
                marginBottom: "8px",
              }}
            >
              {stat.value}
            </p>
            {stat.href && (
              <Link
                href={stat.href}
                style={{
                  fontSize: "12px",
                  color: "var(--color-gold)",
                  textDecoration: "none",
                }}
              >
                ver detalhes →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(pendingMissions > 0 || bannedCount > 0 || pendingShipments > 0) && (
        <div
          style={{
            background: "rgba(196,49,75,0.08)",
            border: "1px solid rgba(196,49,75,0.25)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <p
            className="font-display"
            style={{ color: "var(--color-cherry)", fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}
          >
            ⚠️ Alertas
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pendingMissions > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ color: "var(--color-cream)", fontSize: "14px" }}>
                  {pendingMissions} {pendingMissions === 1 ? "missão aguarda" : "missões aguardam"} aprovação
                </p>
                <Link
                  href="/admin/missions"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "var(--color-cherry)",
                    color: "var(--color-cream)",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Revisar
                </Link>
              </div>
            )}
            {pendingShipments > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ color: "var(--color-cream)", fontSize: "14px" }}>
                  {pendingShipments} {pendingShipments === 1 ? "endereço enviado aguarda" : "endereços enviados aguardam"} postagem
                </p>
                <Link
                  href="/admin/shipments"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "var(--color-cherry)",
                    color: "var(--color-cream)",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Enviar
                </Link>
              </div>
            )}
            {bannedCount > 0 && (
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
                {bannedCount} {bannedCount === 1 ? "usuário banido" : "usuários banidos"}
              </p>
            )}
          </div>
        </div>
      )}

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
                color: "var(--color-cream)",
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
