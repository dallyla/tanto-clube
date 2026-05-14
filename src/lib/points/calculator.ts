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

export function calculateScrobblePoints(
  scrobble: NormalizedScrobble,
  era: Era | null,
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
    return {
      rawPoints,
      pointsEarned: rawPoints,
      isFocusAlbum,
      isFocusTrack,
      multiplierBreakdown: "sem era ativa",
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
