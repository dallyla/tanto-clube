/**
 * Seed da Era I — "Camarim Pop"
 * Uso: npm run db:seed
 *
 * Pré-requisito: DATABASE_URL configurado no .env.local
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eras } from "../db/schema/eras";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const ERA_I = {
  name: "Era I — Camarim Pop",
  slug: "era-i-camarim-pop",
  emoji: "🎭",
  tagline: "O show começa agora. Ouça, acumule pontos e entre para a história.",

  startsAt: new Date("2026-04-01T00:00:00-03:00"),
  endsAt: new Date("2026-05-19T23:59:59-03:00"),
  status: "active" as const,

  // Last.fm matching — ajuste para os álbuns/tracks reais do Diego
  artistName: "Diego Martins",
  focusAlbum: "Camarim Pop",
  focusTracks: [
    "Camarim Pop",
    "Luz de Neon",
    "Palco Vazio",
    "Bastidores",
  ],

  // Multiplicadores
  baseMultiplier: "1.00",
  focusAlbumMultiplier: "2.00",
  focusTrackMultiplier: "3.00",
  launchWindowMultiplier: "1.50",
  launchWindowEndsAt: new Date("2026-04-15T23:59:59-03:00"),

  // Caps anti-fraude
  maxDailyFocusScrobbles: 150,
  maxDailyTotalScrobbles: 200,
  maxHourlyScrobbles: 25,
};

async function main() {
  console.log("🌱 Iniciando seed da Era I...");

  const existing = await db
    .select({ id: eras.id })
    .from(eras)
    .where(eq(eras.slug, ERA_I.slug))
    .limit(1);

  if (existing.length > 0) {
    console.log("⚠️  Era I já existe (slug:", ERA_I.slug, "). Pulando insert.");
    process.exit(0);
  }

  const [inserted] = await db.insert(eras).values(ERA_I).returning({ id: eras.id, name: eras.name });

  console.log("✅ Era I criada:", inserted);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
