import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { eras } from "@/db/schema/eras";
import { eq } from "drizzle-orm";
import { EraForm } from "../era-form";

export const metadata: Metadata = { title: "Editar Era" };
export const revalidate = 0;

function toLocalDatetimeValue(d: Date) {
  // Returns YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditEraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const [era] = await db
    .select()
    .from(eras)
    .where(eq(eras.id, id))
    .limit(1);

  if (!era) notFound();

  const initial = {
    name: era.name,
    slug: era.slug,
    emoji: era.emoji,
    tagline: era.tagline ?? "",
    startsAt: toLocalDatetimeValue(era.startsAt),
    endsAt: toLocalDatetimeValue(era.endsAt),
    status: (era.status === "active" || era.status === "ended") ? "scheduled" as const : (era.status as "draft" | "scheduled"),
    focusAlbum: era.focusAlbum ?? "",
    focusTracks: (era.focusTracks ?? []).join("\n"),
    baseMultiplier: String(era.baseMultiplier),
    focusAlbumMultiplier: String(era.focusAlbumMultiplier),
    focusTrackMultiplier: String(era.focusTrackMultiplier),
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link
          href="/admin/eras"
          style={{
            fontSize: "13px",
            color: "var(--color-muted-foreground)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "12px",
          }}
        >
          ← Eras
        </Link>
        <h1
          className="font-display"
          style={{
            color: "var(--color-cream)",
            fontSize: "28px",
            fontWeight: 500,
            fontStyle: "italic",
          }}
        >
          {era.emoji} {era.name}
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
          status: {era.status}
        </p>
      </div>

      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "28px",
        }}
      >
        <EraForm mode="edit" eraId={id} currentStatus={era.status} initial={initial} />
      </div>
    </div>
  );
}
