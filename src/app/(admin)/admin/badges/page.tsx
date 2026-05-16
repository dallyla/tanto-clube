import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { badges, userBadges } from "@/db/schema/badges";
import { eras } from "@/db/schema/eras";
import { eq, desc, count } from "drizzle-orm";
import { BadgesManager } from "./badges-manager";

export const metadata: Metadata = { title: "Badges" };
export const revalidate = 0;

export default async function AdminBadgesPage() {
  await requireAdmin();

  const allBadges = await db
    .select({
      id: badges.id,
      slug: badges.slug,
      name: badges.name,
      description: badges.description,
      emoji: badges.emoji,
      category: badges.category,
      criteriaType: badges.criteriaType,
      isSecret: badges.isSecret,
      displayOrder: badges.displayOrder,
      eraId: badges.eraId,
      eraName: eras.name,
      createdAt: badges.createdAt,
    })
    .from(badges)
    .leftJoin(eras, eq(badges.eraId, eras.id))
    .orderBy(desc(badges.createdAt));

  const allEras = await db
    .select({ id: eras.id, name: eras.name, emoji: eras.emoji })
    .from(eras)
    .orderBy(desc(eras.startsAt));

  const earnedCounts = await db
    .select({ badgeId: userBadges.badgeId, total: count() })
    .from(userBadges)
    .groupBy(userBadges.badgeId);

  const countMap = new Map(earnedCounts.map((r) => [r.badgeId, r.total]));
  const badgesWithCount = allBadges.map((b) => ({ ...b, earnedCount: countMap.get(b.id) ?? 0 }));

  return (
    <div style={{ maxWidth: "900px" }}>
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
          Badges
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
          {allBadges.length} {allBadges.length === 1 ? "badge cadastrado" : "badges cadastrados"}
        </p>
      </div>

      <BadgesManager badges={badgesWithCount} eras={allEras} />
    </div>
  );
}
