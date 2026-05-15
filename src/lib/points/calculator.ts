import type { Era } from "@/db/schema";
import type { NormalizedScrobble } from "@/lib/lastfm/types";

export interface PointsResult {
  rawPoints: number;
  pointsEarned: number;
  isFocusAlbum: boolean;
  isFocusTrack: boolean;
  multiplierBreakdown: string;
}

// Base points per scrobble
const BASE_POINTS_ARTIST = 10;
const BASE_POINTS_FOCUS_ALBUM = 30;
const BASE_POINTS_LAUNCH_WINDOW = 50;

// Streak multiplier: ×1.2 at 7 days, scaling to ×2.0 at 100 days
export function streakMultiplier(streak: number): number {
  if (streak >= 100) return 2.0;
  if (streak >= 60) return 1.8;
  if (streak >= 30) return 1.6;
  if (streak >= 14) return 1.4;
  if (streak >= 7) return 1.2;
  return 1.0;
}

export function calculateScrobblePoints(
  scrobble: NormalizedScrobble,
  era: Era | null,
  currentStreak = 0,
): PointsResult {
  const albumLower = scrobble.albumName.toLowerCase();
  const trackLower = scrobble.trackName.toLowerCase();

  const isFocusAlbum = era?.focusAlbum
    ? albumLower === era.focusAlbum.toLowerCase()
    : false;

  const isFocusTrack = era?.focusTracks
    ? era.focusTracks.some((t) => t.toLowerCase() === trackLower)
    : false;

  const isInLaunchWindow =
    era?.launchWindowEndsAt && scrobble.scrobbledAt <= era.launchWindowEndsAt;

  // Base points selection
  let rawPoints: number;
  if (isInLaunchWindow) {
    rawPoints = BASE_POINTS_LAUNCH_WINDOW;
  } else if (isFocusAlbum) {
    rawPoints = BASE_POINTS_FOCUS_ALBUM;
  } else {
    rawPoints = BASE_POINTS_ARTIST;
  }

  if (!era) {
    const sMultiplier = streakMultiplier(currentStreak);
    const pointsEarned = Math.round(rawPoints * sMultiplier);
    const parts = sMultiplier > 1 ? [`×${sMultiplier} streak (${currentStreak}d)`] : ["sem era ativa"];
    return {
      rawPoints,
      pointsEarned,
      isFocusAlbum,
      isFocusTrack,
      multiplierBreakdown: parts.join(", "),
    };
  }

  // Multiplier stack (they multiply each other)
  let multiplier = parseFloat(era.baseMultiplier);
  const parts: string[] = [`×${era.baseMultiplier} base`];

  if (isFocusTrack && parseFloat(era.focusTrackMultiplier) > 1) {
    multiplier *= parseFloat(era.focusTrackMultiplier);
    parts.push(`×${era.focusTrackMultiplier} faixa foco`);
  } else if (isFocusAlbum && parseFloat(era.focusAlbumMultiplier) > 1) {
    multiplier *= parseFloat(era.focusAlbumMultiplier);
    parts.push(`×${era.focusAlbumMultiplier} álbum foco`);
  }

  if (isInLaunchWindow && parseFloat(era.launchWindowMultiplier) > 1) {
    multiplier *= parseFloat(era.launchWindowMultiplier);
    parts.push(`×${era.launchWindowMultiplier} janela de lançamento`);
  }

  const sMultiplier = streakMultiplier(currentStreak);
  if (sMultiplier > 1) {
    multiplier *= sMultiplier;
    parts.push(`×${sMultiplier} streak (${currentStreak}d)`);
  }

  const pointsEarned = Math.round(rawPoints * multiplier);

  return {
    rawPoints,
    pointsEarned,
    isFocusAlbum,
    isFocusTrack,
    multiplierBreakdown: parts.join(", "),
  };
}

// Streak bonus points
export function streakBonusPoints(streakDays: number): number {
  if (streakDays === 100) return 5000;
  if (streakDays === 60) return 3000;
  if (streakDays === 30) return 2000;
  if (streakDays === 14) return 1000;
  if (streakDays === 7) return 500;
  return 50; // daily streak maintenance
}

// Monthly top artist bonus
export function topArtistBonus(rank: number): number {
  if (rank === 1) return 1000;
  if (rank <= 5) return 300;
  return 0;
}
