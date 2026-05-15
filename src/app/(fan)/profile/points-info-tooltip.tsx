"use client";

import { useState, useRef, useEffect } from "react";

const ROWS: { label: string; value: string }[] = [
  { label: "Qualquer música do artista", value: "10 pts" },
  { label: "Álbum em foco", value: "30 pts" },
  { label: "Janela de lançamento", value: "50 pts" },
];

const STREAK_ROWS: { label: string; value: string }[] = [
  { label: "7+ dias consecutivos", value: "×1.2" },
  { label: "14+ dias consecutivos", value: "×1.4" },
  { label: "30+ dias consecutivos", value: "×1.6" },
  { label: "60+ dias consecutivos", value: "×1.8" },
  { label: "100+ dias consecutivos", value: "×2.0" },
];

const BONUS_ROWS: { label: string; value: string }[] = [
  { label: "Bônus diário de streak", value: "+50 pts" },
  { label: "Marco: 7 dias", value: "+500 pts" },
  { label: "Marco: 14 dias", value: "+1.000 pts" },
  { label: "Marco: 30 dias", value: "+2.000 pts" },
  { label: "Marco: 60 dias", value: "+3.000 pts" },
  { label: "Marco: 100 dias", value: "+5.000 pts" },
];

export default function PointsInfoTooltip() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-label="Como os pontos são calculados"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold leading-none transition-colors"
        style={{
          border: "1px solid var(--color-muted-foreground)",
          color: "var(--color-muted-foreground)",
        }}
      >
        i
      </button>

      {open && (
        <div
          className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-[260px] rounded-xl p-4 flex flex-col gap-3 text-left shadow-xl"
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border-strong)",
          }}
        >
          {/* Arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid var(--color-border-strong)",
            }}
          />

          <p className="text-gold font-semibold text-xs uppercase tracking-wide">
            Como ganhar pontos
          </p>

          <section className="flex flex-col gap-1">
            <p className="text-[color:var(--color-muted-foreground)] text-[10px] uppercase tracking-wider mb-0.5">
              Base por scrobble
            </p>
            {ROWS.map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-cream text-xs">{r.label}</span>
                <span className="text-gold text-xs font-semibold tabular-nums">{r.value}</span>
              </div>
            ))}
          </section>

          <div className="divider-dashed" />

          <section className="flex flex-col gap-1">
            <p className="text-[color:var(--color-muted-foreground)] text-[10px] uppercase tracking-wider mb-0.5">
              Multiplicador de streak
            </p>
            {STREAK_ROWS.map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-cream text-xs">{r.label}</span>
                <span className="text-gold text-xs font-semibold tabular-nums">{r.value}</span>
              </div>
            ))}
          </section>

          <div className="divider-dashed" />

          <section className="flex flex-col gap-1">
            <p className="text-[color:var(--color-muted-foreground)] text-[10px] uppercase tracking-wider mb-0.5">
              Bônus de streak
            </p>
            {BONUS_ROWS.map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-cream text-xs">{r.label}</span>
                <span className="text-gold text-xs font-semibold tabular-nums">{r.value}</span>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
