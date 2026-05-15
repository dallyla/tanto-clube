"use client";

import { useState } from "react";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-cream text-sm font-medium">{label}</span>
        <span className="text-[color:var(--color-muted-foreground)] text-xs mt-0.5">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-gold" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsForm({
  initialAnonymousMode,
  initialEmailEnabled,
}: {
  initialAnonymousMode: boolean;
  initialEmailEnabled: boolean;
}) {
  const [anonymousMode, setAnonymousMode] = useState(initialAnonymousMode);
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(patch: { anonymousMode?: boolean; emailEnabled?: boolean }) {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function handleAnonymous(val: boolean) {
    setAnonymousMode(val);
    save({ anonymousMode: val });
  }

  function handleEmail(val: boolean) {
    setEmailEnabled(val);
    save({ emailEnabled: val });
  }

  return (
    <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-cream text-base font-semibold">Configurações</h2>
        {saving && <span className="text-[color:var(--color-muted-foreground)] text-xs">Salvando...</span>}
        {!saving && saved && <span className="text-gold text-xs">Salvo ✓</span>}
      </div>

      <Toggle
        checked={anonymousMode}
        onChange={handleAnonymous}
        label="Modo anônimo"
        description="Oculta seu nome no ranking público"
      />

      <div className="divider-dashed" />

      <Toggle
        checked={emailEnabled}
        onChange={handleEmail}
        label="Receber e-mails"
        description="Notificações de ranking e prêmios"
      />

      <div className="divider-dashed" />

      <div className="flex flex-col gap-2 pt-1">
        <a
          href="mailto:suporte@tantoclube.com.br"
          className="text-[color:var(--color-muted-foreground)] hover:text-cream text-sm transition-colors"
        >
          Falar com suporte →
        </a>
      </div>
    </div>
  );
}
