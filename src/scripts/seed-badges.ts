/**
 * Seed de badges do TANTO Clube
 * Uso: npm run db:seed-badges
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { badges } from "../db/schema/badges";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const BADGES = [
  // --- Volume (automáticos) ---
  {
    slug: "primeiro-scrobble",
    name: "Primeiro Passo",
    description: "Registrou o primeiro scrobble do artista",
    emoji: "🎵",
    category: "volume" as const,
    criteriaType: "automatic",
    criteriaConfig: { type: "artist_scrobbles", threshold: 1 },
    displayOrder: 10,
  },
  {
    slug: "superfan-500",
    name: "Fã de Carteirinha",
    description: "500 scrobbles do artista",
    emoji: "🎤",
    category: "volume" as const,
    criteriaType: "automatic",
    criteriaConfig: { type: "artist_scrobbles", threshold: 500 },
    displayOrder: 20,
  },
  {
    slug: "superfan-2000",
    name: "Superfã",
    description: "2.000 scrobbles do artista",
    emoji: "🥇",
    category: "volume" as const,
    criteriaType: "automatic",
    criteriaConfig: { type: "artist_scrobbles", threshold: 2000 },
    displayOrder: 30,
  },
  {
    slug: "maratonista",
    name: "Maratonista",
    description: "5.000 scrobbles totais no clube",
    emoji: "🏃",
    category: "volume" as const,
    criteriaType: "automatic",
    criteriaConfig: { type: "total_scrobbles", threshold: 5000 },
    displayOrder: 40,
  },

  // --- Catálogo (automáticos) ---
  {
    slug: "cartografo",
    name: "Cartógrafo",
    description: "Ouviu 18 faixas únicas do artista",
    emoji: "🗺️",
    category: "catalog" as const,
    criteriaType: "automatic",
    criteriaConfig: { type: "unique_tracks", threshold: 18 },
    displayOrder: 50,
  },
  {
    slug: "explorador",
    name: "Explorador",
    description: "Ouviu 50 faixas únicas do artista",
    emoji: "🧭",
    category: "catalog" as const,
    criteriaType: "automatic",
    criteriaConfig: { type: "unique_tracks", threshold: 50 },
    displayOrder: 60,
  },

  // --- Temporal (automáticos) ---
  {
    slug: "streak-7",
    name: "Semana Perfeita",
    description: "7 dias consecutivos ouvindo",
    emoji: "🔥",
    category: "temporal" as const,
    criteriaType: "automatic",
    criteriaConfig: { type: "streak_days", threshold: 7 },
    displayOrder: 70,
  },
  {
    slug: "streak-30",
    name: "Devoto",
    description: "30 dias consecutivos ouvindo",
    emoji: "💫",
    category: "temporal" as const,
    criteriaType: "automatic",
    criteriaConfig: { type: "streak_days", threshold: 30 },
    displayOrder: 80,
  },

  // --- Era (manuais) ---
  {
    slug: "era-i-badge",
    name: "Era I — Camarim Pop",
    description: "Participou da primeira Era do clube",
    emoji: "🎭",
    category: "era" as const,
    criteriaType: "manual",
    criteriaConfig: null,
    isIrrecoverable: true,
    displayOrder: 100,
  },
  {
    slug: "top1-era-i",
    name: "Estrela da Era",
    description: "Top 1 do ranking na Era I",
    emoji: "👑",
    category: "era" as const,
    criteriaType: "manual",
    criteriaConfig: null,
    isIrrecoverable: true,
    displayOrder: 101,
  },

  // --- Top mensal (manual) ---
  {
    slug: "top-mes",
    name: "Fã do Mês",
    description: "Top 1 do ranking mensal",
    emoji: "🏆",
    category: "monthly_top" as const,
    criteriaType: "manual",
    criteriaConfig: null,
    isIrrecoverable: true,
    displayOrder: 110,
  },
];

async function main() {
  console.log("🌱 Iniciando seed de badges...");

  let inserted = 0;
  let skipped = 0;

  for (const badge of BADGES) {
    const existing = await db
      .select({ id: badges.id })
      .from(badges)
      .where(eq(badges.slug, badge.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭  ${badge.slug} já existe`);
      skipped++;
      continue;
    }

    await db.insert(badges).values({
      ...badge,
      isSecret: false,
      isIrrecoverable: badge.isIrrecoverable ?? false,
    });

    console.log(`  ✅ ${badge.emoji} ${badge.name}`);
    inserted++;
  }

  console.log(`\n🎉 Concluído: ${inserted} inseridos, ${skipped} já existiam.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
