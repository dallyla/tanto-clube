import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { missions } from "@/db/schema/missions";
import { eras } from "@/db/schema/eras";
import { eq, desc } from "drizzle-orm";
import { MissionForm } from "../../mission-form";

export const metadata: Metadata = { title: "Editar Missão" };

export default async function EditMissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [[mission], allEras] = await Promise.all([
    db.select().from(missions).where(eq(missions.id, id)).limit(1),
    db
      .select({ id: eras.id, name: eras.name, emoji: eras.emoji })
      .from(eras)
      .orderBy(desc(eras.createdAt)),
  ]);

  if (!mission) notFound();

  function toLocalDatetime(d: Date | null): string {
    if (!d) return "";
    const dt = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <Link
          href="/admin/missions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted-foreground)",
            textDecoration: "none",
            fontSize: "16px",
            flexShrink: 0,
          }}
        >
          ←
        </Link>
        <div>
          <h1
            className="font-display"
            style={{
              color: "var(--color-cream)",
              fontSize: "24px",
              fontWeight: 500,
              fontStyle: "italic",
            }}
          >
            Editar Missão
          </h1>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
            {mission.emoji} {mission.title}
          </p>
        </div>
      </div>

      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "28px",
        }}
      >
        <MissionForm
          mode="edit"
          missionId={mission.id}
          eras={allEras}
          initial={{
            title: mission.title,
            description: mission.description,
            emoji: mission.emoji,
            pointsReward: String(mission.pointsReward),
            requiresScreenshot: mission.requiresScreenshot,
            eraId: mission.eraId ?? "",
            startsAt: toLocalDatetime(mission.startsAt),
            endsAt: toLocalDatetime(mission.endsAt),
            isActive: mission.isActive,
            maxCompletionsPerUser: String(mission.maxCompletionsPerUser),
          }}
        />
      </div>
    </div>
  );
}
