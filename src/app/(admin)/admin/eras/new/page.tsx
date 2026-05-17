import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { prizePacks } from "@/db/schema/prizes";
import { eq, desc } from "drizzle-orm";
import { EraForm } from "../era-form";

export const metadata: Metadata = { title: "Nova Era" };

export default async function NewEraPage() {
  await requireAdmin();

  const allPacks = await db
    .select({ id: prizePacks.id, name: prizePacks.name, emoji: prizePacks.emoji })
    .from(prizePacks)
    .where(eq(prizePacks.isActive, 1))
    .orderBy(desc(prizePacks.createdAt));

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
          Nova Era
        </h1>
      </div>

      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "28px",
        }}
      >
        <EraForm mode="new" availablePacks={allPacks} />
      </div>
    </div>
  );
}
