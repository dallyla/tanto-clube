"use client";

import { useState } from "react";

const EMOJIS = [
  "🎵", "🎶", "🎸", "🎹", "🎺", "🎻", "🥁", "🎤", "🎧", "🎼",
  "🌟", "⭐", "🔥", "💫", "✨", "🎯", "🏆", "💎",
  "🦁", "🐺", "🦊", "🐉", "🌙", "☀️", "🌈",
];

export default function ProfileEditForm({
  initialName,
  initialEmoji,
}: {
  initialName: string;
  initialEmoji: string;
}) {
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, avatarEmoji: emoji }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setError("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-5">
      <h2 className="font-display text-cream text-base font-semibold">Editar perfil</h2>

      <div className="flex flex-col gap-1">
        <label className="text-[color:var(--color-muted-foreground)] text-xs">Nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="w-full bg-transparent border border-[color:var(--color-border)] text-cream rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[color:var(--color-muted-foreground)] text-xs">Avatar</label>
        <div className="grid grid-cols-8 gap-1.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`text-xl py-1.5 rounded-lg transition-colors ${
                emoji === e
                  ? "bg-gold/20 ring-1 ring-gold"
                  : "hover:bg-white/5"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-cherry text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-cherry hover:bg-cherry/80 disabled:opacity-50 text-cream font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar alterações"}
      </button>
    </div>
  );
}
