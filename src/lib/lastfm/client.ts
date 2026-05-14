import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis/client";
import type {
  LastfmRecentTracksResponse,
  LastfmUserInfo,
  LastfmTopArtistsResponse,
  NormalizedScrobble,
} from "./types";

const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
const ARTIST_NAME_NORMALIZED = "diego martins";

// 5 req/s global limit per Last.fm ToS
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 s"),
  prefix: "lastfm",
});

async function fetchLastfm<T>(params: Record<string, string>): Promise<T> {
  const { success, reset } = await ratelimit.limit("global");
  if (!success) {
    const waitMs = reset - Date.now();
    await new Promise((r) => setTimeout(r, waitMs));
  }

  const url = new URL(LASTFM_API_BASE);
  url.searchParams.set("api_key", process.env.LASTFM_API_KEY!);
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 }, // always fresh
  });

  if (!res.ok) {
    throw new Error(`Last.fm API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  }
  return data as T;
}

export async function getUserInfo(username: string): Promise<LastfmUserInfo["user"]> {
  const data = await fetchLastfm<LastfmUserInfo>({
    method: "user.getInfo",
    user: username,
  });
  return data.user;
}

export async function getRecentTracks(
  username: string,
  fromTimestamp?: number,
  page = 1,
): Promise<{ tracks: NormalizedScrobble[]; totalPages: number; total: number }> {
  const params: Record<string, string> = {
    method: "user.getRecentTracks",
    user: username,
    limit: "200",
    page: String(page),
    extended: "0",
  };

  if (fromTimestamp) {
    params.from = String(fromTimestamp);
  }

  const data = await fetchLastfm<LastfmRecentTracksResponse>(params);
  const rawTracks = Array.isArray(data.recenttracks.track)
    ? data.recenttracks.track
    : [data.recenttracks.track];

  const tracks: NormalizedScrobble[] = rawTracks
    .filter((t) => !t["@attr"]?.nowplaying && t.date?.uts) // skip now playing
    .filter((t) => t.artist["#text"].toLowerCase() === ARTIST_NAME_NORMALIZED)
    .map((t) => ({
      trackKey: `${t.artist["#text"].toLowerCase()}::${t.name.toLowerCase()}::${t.album["#text"].toLowerCase()}`,
      trackName: t.name,
      artistName: t.artist["#text"],
      albumName: t.album["#text"] || "",
      scrobbledAt: new Date(parseInt(t.date!.uts, 10) * 1000),
    }));

  return {
    tracks,
    totalPages: parseInt(data.recenttracks["@attr"].totalPages, 10),
    total: parseInt(data.recenttracks["@attr"].total, 10),
  };
}

export async function getTopArtists(
  username: string,
  period: "7day" | "1month" | "3month" | "overall" = "1month",
): Promise<LastfmTopArtistsResponse["topartists"]["artist"]> {
  const data = await fetchLastfm<LastfmTopArtistsResponse>({
    method: "user.getTopArtists",
    user: username,
    period,
    limit: "10",
  });

  return Array.isArray(data.topartists.artist)
    ? data.topartists.artist
    : [data.topartists.artist];
}

export function isAccountOldEnough(registeredUnixTime: number, minDays = 7): boolean {
  const ageMs = Date.now() - registeredUnixTime * 1000;
  return ageMs >= minDays * 24 * 60 * 60 * 1000;
}

export function getDiegoRankInTopArtists(
  artists: LastfmTopArtistsResponse["topartists"]["artist"],
): number | null {
  const arr = Array.isArray(artists) ? artists : [artists];
  const idx = arr.findIndex(
    (a) => a.name.toLowerCase() === ARTIST_NAME_NORMALIZED,
  );
  return idx === -1 ? null : idx + 1;
}
