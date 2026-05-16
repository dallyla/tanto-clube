/**
 * Seed de 60 usuários mockados para testar o ranking.
 * Uso: npx tsx src/scripts/seed-mock-users.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users } from "../db/schema/users";
import { pointsTransactions } from "../db/schema/points";
import { scrobbles } from "../db/schema/scrobbles";
import { eras } from "../db/schema/eras";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const EMOJIS = ["🪂", "🌙", "⭐", "💫", "🎭", "🌈", "👑", "🦋", "🔥", "⚡", "💎", "🌹", "🎤", "🎵", "🎧", "🪩"];

const NAMES = [
  "Ana Clara", "Beatriz Lima", "Camila Torres", "Daniela Souza", "Eduarda Ferreira",
  "Fernanda Costa", "Gabriela Alves", "Helena Martins", "Isabela Rocha", "Juliana Neves",
  "Karla Mendes", "Letícia Campos", "Mariana Oliveira", "Natalia Pereira", "Olívia Santos",
  "Patrícia Gomes", "Rafaela Ribeiro", "Sabrina Freitas", "Tainara Cardoso", "Valentina Cruz",
  "Amanda Pinto", "Bruna Lopes", "Carolina Melo", "Diana Faria", "Elisa Moreira",
  "Flávia Barbosa", "Giovanna Ramos", "Hannah Correia", "Ingrid Teixeira", "Jéssica Carvalho",
  "Kelly Araújo", "Larissa Batista", "Melissa Andrade", "Nicole Figueiredo", "Priscila Rodrigues",
  "Renata Nascimento", "Sofia Cunha", "Thainá Vieira", "Úrsula Monteiro", "Viviane Assis",
  "Alice Borges", "Bianca Machado", "Cecília Dias", "Débora Vargas", "Eloá Cavalcante",
  "Fabiana Coelho", "Gisele Medeiros", "Heloísa Castro", "Íris Nogueira", "Joana Magalhães",
  "Keila Tavares", "Lívia Sampaio", "Monique Azevedo", "Nayara Guimarães", "Pâmela Leal",
  "Rebecca Pires", "Simone Queiroz", "Tamires Barros", "Urânia Moura", "Zara Leão",
];

const TRACKS = [
  "Chega", "Te Esperei", "Ao Vivo em Mim", "Leve", "Pra Sempre",
  "Sonho Meu", "Vai e Volta", "Entre Nós", "De Verdade", "Infinito",
];

function randomPoints(rank: number): number {
  const base = 500_000 * Math.exp(-0.1 * (rank - 1));
  const jitter = base * (0.85 + Math.random() * 0.3);
  return Math.max(100, Math.round(jitter));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateInCurrentMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const ms = start.getTime() + Math.random() * (now.getTime() - start.getTime());
  return new Date(ms);
}

async function main() {
  console.log("🌱 Criando 60 usuários mockados...");

  const [activeEra] = await db
    .select({ id: eras.id, focusAlbum: eras.focusAlbum, artistName: eras.artistName })
    .from(eras)
    .where(eq(eras.status, "active"))
    .limit(1);

  if (!activeEra) {
    console.warn("⚠️  Nenhuma era ativa encontrada — abas 'era' e 'álbum' não terão dados mock.");
  }

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < 60; i++) {
    const name = NAMES[i];
    const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".");
    const email = `mock.${slug}.${i}@tantoclube.test`;
    const totalPts = randomPoints(i + 1);

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string;

    if (existing.length > 0) {
      userId = existing[0].id;
      skipped++;
    } else {
      const [inserted] = await db.insert(users).values({
        email,
        emailVerified: true,
        displayName: name,
        avatarEmoji: EMOJIS[i % EMOJIS.length],
        isOnboarded: true,
        totalPoints: totalPts,
        currentStreak: randomInt(0, 30),
        longestStreak: randomInt(0, 60),
        anonymousMode: i % 8 === 0,
        lastfmUsername: `${slug}_lastfm`,
      }).returning({ id: users.id });
      userId = inserted.id;
      created++;
    }

    // pointsTransactions para abas "era" e "mes"
    if (activeEra) {
      const eraPts = Math.round(totalPts * (0.5 + Math.random() * 0.4));
      await db.insert(pointsTransactions).values({
        userId,
        amount: eraPts,
        type: "scrobble",
        description: "mock seed — era points",
        eraId: activeEra.id,
        createdAt: randomDateInCurrentMonth(),
      });
    }

    // scrobbles para aba "álbum"
    if (activeEra) {
      const numScrobbles = randomInt(3, 15);
      const scrobbleRows = Array.from({ length: numScrobbles }, (_, j) => {
        const track = TRACKS[j % TRACKS.length];
        const album = activeEra.focusAlbum ?? "Álbum Foco";
        const artist = activeEra.artistName;
        const scrobbledAt = randomDateInCurrentMonth();
        const pts = randomInt(10, 80);
        return {
          userId,
          eraId: activeEra.id,
          lastfmTrackKey: `${artist}::${track}::${album}::mock${i}${j}`,
          trackName: track,
          artistName: artist,
          albumName: album,
          scrobbledAt,
          isFocusAlbum: true,
          isFocusTrack: false,
          isCounted: true,
          rawPoints: pts,
          pointsEarned: pts,
        };
      });
      await db.insert(scrobbles).values(scrobbleRows);
    }
  }

  console.log(`✅ Criados: ${created} | Pulados (já existiam): ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
