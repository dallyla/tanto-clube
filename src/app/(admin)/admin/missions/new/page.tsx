import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { desc } from "drizzle-orm";
import { MissionForm } from "../mission-form";

export const metadata: Metadata = { title: "Nova Missão" };

export default async function NewMissionPage() {
  await requireAdmin();

  const allEras = await db
    .select({ id: eras.id, name: eras.name, emoji: eras.emoji })
    .from(eras)
    .orderBy(desc(eras.createdAt));

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
            Nova Missão
          </h1>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
            Crie uma missão para os fãs completarem
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
        <MissionForm mode="new" eras={allEras} />
      </div>
    </div>
  );
}
