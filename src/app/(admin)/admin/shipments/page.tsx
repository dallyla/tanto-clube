import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { prizeAwards } from "@/db/schema/prizes";
import { prizes } from "@/db/schema/prizes";
import { users } from "@/db/schema/users";
import { eras } from "@/db/schema/eras";
import { eq, desc } from "drizzle-orm";
import { ShipmentsTable } from "./shipments-table";

export const metadata: Metadata = { title: "Envio" };
export const revalidate = 0;

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Aguardando revisão",
  approved: "Aprovado",
  address_pending: "Endereço pendente",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export default async function AdminShipmentsPage() {
  await requireAdmin();

  const awards = await db
    .select({
      id: prizeAwards.id,
      userId: prizeAwards.userId,
      prizeId: prizeAwards.prizeId,
      eraId: prizeAwards.eraId,
      awardedReason: prizeAwards.awardedReason,
      status: prizeAwards.status,
      awardedAt: prizeAwards.awardedAt,
      fanName: users.displayName,
      fanEmail: users.email,
      avatarEmoji: users.avatarEmoji,
      prizeName: prizes.name,
      prizeType: prizes.prizeType,
      eraName: eras.name,
    })
    .from(prizeAwards)
    .innerJoin(users, eq(prizeAwards.userId, users.id))
    .innerJoin(prizes, eq(prizeAwards.prizeId, prizes.id))
    .leftJoin(eras, eq(prizeAwards.eraId, eras.id))
    .orderBy(desc(prizeAwards.awardedAt));

  return (
    <div style={{ maxWidth: "1000px" }}>
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
          Envios
        </h1>
        <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
          {awards.length} {awards.length === 1 ? "prêmio registrado" : "prêmios registrados"}
        </p>
      </div>

      {awards.length === 0 ? (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>📦</p>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
            Nenhum prêmio atribuído ainda.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <ShipmentsTable awards={awards.map((a) => ({ ...a, eraName: a.eraName ?? null, avatarEmoji: a.avatarEmoji ?? null }))} statusLabels={STATUS_LABELS} />
        </div>
      )}
    </div>
  );
}
