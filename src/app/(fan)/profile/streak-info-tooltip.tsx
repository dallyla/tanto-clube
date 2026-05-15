"use client";

import { useState, useRef, useEffect } from "react";


export default function StreakInfoTooltip() {
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
        aria-label="O que é streak"
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
          className="absolute z-50 bottom-full mb-2 right-0 w-[260px] rounded-xl p-4 flex flex-col gap-3 text-left shadow-xl"
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border-strong)",
          }}
        >
          {/* Arrow aligned to the button (top-right) */}
          <div
            className="absolute right-1.5 top-full w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid var(--color-border-strong)",
            }}
          />

          <p className="text-gold font-semibold text-xs uppercase tracking-wide">
            O que é streak?
          </p>

          <p className="text-cream text-xs leading-relaxed">
            Streak conta quantos <span className="text-gold font-semibold">dias consecutivos</span> você
            ouviu Diego Martins. Basta registrar ao menos um scrobble por dia para mantê-lo vivo.
          </p>
        </div>
      )}
    </div>
  );
}
