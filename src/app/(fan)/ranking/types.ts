export type Tab = "era" | "mes" | "geral" | "album";

export type RankedFan = {
  id: string;
  displayName: string;
  avatarEmoji: string | null;
  avatarUrl: string | null;
  anonymousMode: boolean;
  points: number;
};

export const PAGE_SIZE = 50;
