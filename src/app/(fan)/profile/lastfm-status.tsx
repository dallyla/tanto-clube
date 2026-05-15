"use client";

import { useState } from "react";

function formatDate(date: Date | null): string {
  if (!date) return "Nunca";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LastfmStatus({
  lastfmUsername,
  lastPollAt,
  nextPollAt,
}: {
  lastfmUsername: string;
  lastPollAt: Date | null;
  nextPollAt: Date | null;
}) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/user/sync", { method: "POST" });
      setSynced(true);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="font-display text-cream text-base font-semibold">Last.fm</h2>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[color:var(--color-muted-foreground)] text-sm">Conta conectada</span>
          <span className="text-gold text-sm font-medium">{lastfmUsername}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[color:var(--color-muted-foreground)] text-sm">Última sincronização</span>
          <span className="text-cream text-sm">{formatDate(lastPollAt)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[color:var(--color-muted-foreground)] text-sm">Próxima sincronização</span>
          <span className="text-cream text-sm">{formatDate(nextPollAt)}</span>
        </div>
      </div>

      <button
        onClick={handleSync}
        disabled={syncing || synced}
        className="w-full border border-[color:var(--color-border-strong)] text-[color:var(--color-muted-foreground)] hover:text-cream hover:border-cream disabled:opacity-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        {syncing ? "Agendando..." : synced ? "Sincronização agendada ✓" : "Sincronizar agora"}
      </button>

      {synced && (
        <p className="text-[color:var(--color-muted-foreground)] text-xs text-center -mt-2">
          Seus pontos serão atualizados em até 15 minutos.
        </p>
      )}
    </div>
  );
}
