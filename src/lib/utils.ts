import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat("pt-BR").format(points);
}

export function formatRelativeDate(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const diffMs = date.getTime() - Date.now();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, "second");
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minute");
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  return rtf.format(diffDays, "day");
}

export function avatarEmojiFromUsername(username: string): string {
  const pool = ["🪂", "🌙", "⭐", "💫", "🎭", "🌈", "👑", "🦋", "🔥", "⚡", "💎", "🌹", "🎤", "🎵", "🎧", "🪩"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}

export function rankTrend(current: number, previous: number): "up" | "down" | "same" | "new" {
  if (previous === 0) return "new";
  if (current < previous) return "up";
  if (current > previous) return "down";
  return "same";
}
