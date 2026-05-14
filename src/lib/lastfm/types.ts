export interface LastfmTrack {
  name: string;
  artist: { "#text": string; mbid?: string };
  album: { "#text": string; mbid?: string };
  date?: { uts: string; "#text": string };
  "@attr"?: { nowplaying?: string };
  mbid?: string;
  url: string;
}

export interface LastfmRecentTracksResponse {
  recenttracks: {
    track: LastfmTrack | LastfmTrack[];
    "@attr": {
      user: string;
      totalPages: string;
      page: string;
      perPage: string;
      total: string;
    };
  };
}

export interface LastfmUserInfo {
  user: {
    name: string;
    realname?: string;
    registered: { unixtime: string; "#text": string };
    playcount: string;
    image: Array<{ "#text": string; size: string }>;
    subscriber: string;
    bootstrap: string;
    url: string;
    country: string;
    age: string;
    gender: string;
    type: string;
  };
}

export interface LastfmTopArtist {
  name: string;
  playcount: string;
  rank: string;
  mbid?: string;
  url: string;
  image: Array<{ "#text": string; size: string }>;
}

export interface LastfmTopArtistsResponse {
  topartists: {
    artist: LastfmTopArtist | LastfmTopArtist[];
    "@attr": {
      user: string;
      totalPages: string;
      page: string;
      perPage: string;
      total: string;
      period: string;
    };
  };
}

export interface NormalizedScrobble {
  trackKey: string;
  trackName: string;
  artistName: string;
  albumName: string;
  scrobbledAt: Date;
}
