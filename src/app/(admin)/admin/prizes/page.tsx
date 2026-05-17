import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { prizes, prizePacks, prizePackItems } from "@/db/schema/prizes";
import { badges } from "@/db/schema/badges";
import { eq, desc } from "drizzle-orm";
import { PrizesManager } from "./prizes-manager";
import { PacksManager } from "./packs-manager";
import { PrizesTabs } from "./prizes-tabs";

export const metadata: Metadata = { title: "Prêmios" };
export const revalidate = 0;

export default async function AdminPrizesPage() {
  await requireAdmin();

  const allPrizes = await db.select().from(prizes).orderBy(desc(prizes.createdAt));

  const allBadges = await db
    .select({ id: badges.id, name: badges.name, emoji: badges.emoji, slug: badges.slug })
    .from(badges)
    .orderBy(badges.displayOrder, badges.name);

  const allPacks = await db.select().from(prizePacks).orderBy(desc(prizePacks.createdAt));

  const allPackItems = await db
    .select({
      id: prizePackItems.id,
      packId: prizePackItems.packId,
      quantity: prizePackItems.quantity,
      prizeId: prizes.id,
      prizeName: prizes.name,
      prizeType: prizes.prizeType,
    })
    .from(prizePackItems)
    .innerJoin(prizes, eq(prizePackItems.prizeId, prizes.id));

  const itemsByPack = new Map<string, typeof allPackItems>();
  for (const item of allPackItems) {
    if (!itemsByPack.has(item.packId)) itemsByPack.set(item.packId, []);
    itemsByPack.get(item.packId)!.push(item);
  }

  const packsWithItems = allPacks.map((p) => ({ ...p, items: itemsByPack.get(p.id) ?? [] }));

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1
          className="font-display"
          style={{ color: "var(--color-cream)", fontSize: "28px", fontWeight: 500, fontStyle: "italic", marginBottom: "4px" }}
        >
          Prêmios
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
          Prêmios são distribuídos individualmente ou em packs ao anunciar o resultado de uma era.
        </p>
      </div>

      <PrizesTabs
        prizes={<PrizesManager initialPrizes={allPrizes} badges={allBadges} />}
        packs={<PacksManager initialPacks={packsWithItems} availablePrizes={allPrizes} />}
      />
    </div>
  );
}
