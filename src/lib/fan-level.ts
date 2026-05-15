export interface FanLevel {
  name: string;
  emoji: string;
  minPoints: number;
  maxPoints: number | null;
}

const FAN_LEVELS: FanLevel[] = [
  { name: "Iniciante", emoji: "🌱", minPoints: 0, maxPoints: 999 },
  { name: "Ouvinte", emoji: "🎧", minPoints: 1_000, maxPoints: 9_999 },
  { name: "Fã", emoji: "🎵", minPoints: 10_000, maxPoints: 49_999 },
  { name: "Superfã", emoji: "⭐", minPoints: 50_000, maxPoints: 199_999 },
  { name: "Devoto", emoji: "🔥", minPoints: 200_000, maxPoints: 499_999 },
  { name: "Top Fã", emoji: "👑", minPoints: 500_000, maxPoints: null },
];

export function getFanLevel(totalPoints: number): {
  level: FanLevel;
  progress: number; // 0–100
  pointsToNext: number | null;
} {
  const level =
    [...FAN_LEVELS].reverse().find((l) => totalPoints >= l.minPoints) ?? FAN_LEVELS[0];

  if (level.maxPoints === null) {
    return { level, progress: 100, pointsToNext: null };
  }

  const range = level.maxPoints - level.minPoints + 1;
  const earned = totalPoints - level.minPoints;
  const progress = Math.min(100, Math.round((earned / range) * 100));
  const pointsToNext = level.maxPoints + 1 - totalPoints;

  return { level, progress, pointsToNext };
}
