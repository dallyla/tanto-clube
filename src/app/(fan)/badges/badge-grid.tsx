"use client";

import { useState } from "react";

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
};

function BadgeCard({ badge }: { badge: BadgeItem }) {
  const [open, setOpen] = useState(false);

  if (badge.earned) {
    return (
      <div
        onClick={() => setOpen((s) => !s)}
        className="relative flex flex-col items-center justify-center gap-2 rounded-2xl overflow-hidden cursor-pointer select-none"
        style={{
          padding: "16px 8px 14px",
          background: "linear-gradient(155deg, rgb(200 164 92 / 0.28) 0%, rgb(200 164 92 / 0.08) 55%, var(--color-bg-card) 100%)",
          border: "1px solid var(--color-gold)",
          boxShadow: "0 4px 16px rgb(200 164 92 / 0.18), inset 0 1px 0 rgb(255 255 255 / 0.15)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* shine overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgb(255 255 255 / 0.18) 0%, transparent 45%)" }}
        />

        {/* sparkle corner */}
        <span
          className="absolute top-2 right-2.5 text-[10px] leading-none pointer-events-none"
          style={{ color: "var(--color-gold)", opacity: 0.8 }}
        >
          ✦
        </span>

        {/* emoji with halo */}
        <div className="relative flex items-center justify-center" style={{ width: 54, height: 54 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgb(200 164 92 / 0.35) 0%, transparent 72%)" }}
          />
          <span
            className="text-[2.4rem] leading-none relative"
            style={{ filter: "drop-shadow(0 2px 4px rgb(0 0 0 / 0.15))" }}
          >
            {badge.emoji}
          </span>
        </div>

        {/* name */}
        <span
          className="font-display italic text-[11px] font-medium text-center leading-tight relative"
          style={{ color: "var(--color-cream)" }}
        >
          {badge.name}
        </span>

        {/* description overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3"
          style={{
            background: "linear-gradient(155deg, rgb(200 164 92 / 0.96) 0%, rgb(161 122 45 / 0.98) 100%)",
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.18s ease, transform 0.18s ease",
            pointerEvents: open ? "auto" : "none",
          }}
        >
          <span className="text-xl leading-none">{badge.emoji}</span>
          <p
            className="text-[11px] font-medium text-center leading-snug"
            style={{ color: "#2a1a10" }}
          >
            {badge.description}
          </p>
          <span className="text-[9px] mt-0.5" style={{ color: "rgba(42,26,16,0.55)" }}>
            toque para fechar
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setOpen((s) => !s)}
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{
        padding: "16px 8px 14px",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        className="absolute top-2 right-2.5 text-[9px] leading-none"
        style={{ color: "var(--color-muted-foreground)", opacity: 0.5 }}
      >
        🔒
      </span>

      <div className="relative flex items-center justify-center" style={{ width: 54, height: 54 }}>
        <span
          className="text-[2.4rem] leading-none"
          style={{ filter: "grayscale(1) opacity(0.35)" }}
        >
          {badge.emoji}
        </span>
      </div>

      <span
        className="font-display italic text-[11px] text-center leading-tight"
        style={{ color: "var(--color-muted-foreground)", opacity: 0.6 }}
      >
        {badge.name}
      </span>

      {/* description overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3"
        style={{
          background: "color-mix(in srgb, var(--color-bg-elevated) 95%, transparent)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.18s ease, transform 0.18s ease",
          pointerEvents: open ? "auto" : "none",
          border: "1px solid var(--color-border)",
        }}
      >
        <span className="text-xl leading-none" style={{ filter: "grayscale(1) opacity(0.5)" }}>
          {badge.emoji}
        </span>
        <p
          className="text-[11px] text-center leading-snug"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {badge.description}
        </p>
        <span className="text-[9px] mt-0.5" style={{ color: "var(--color-muted-foreground)", opacity: 0.5 }}>
          toque para fechar
        </span>
      </div>
    </div>
  );
}

export function BadgeGrid({
  earnedBadges,
  lockedBadges,
}: {
  earnedBadges: BadgeItem[];
  lockedBadges: BadgeItem[];
}) {
  const lockedVisible = lockedBadges.slice(0, Math.max(0, 9 - earnedBadges.length));
  const remaining = lockedBadges.length - lockedVisible.length;

  return (
    <div className="grid grid-cols-3 gap-3">
      {earnedBadges.map((b) => (
        <BadgeCard key={b.id} badge={b} />
      ))}
      {lockedVisible.map((b) => (
        <BadgeCard key={b.id} badge={b} />
      ))}
      {remaining > 0 && (
        <div
          className="flex flex-col items-center justify-center gap-1 rounded-2xl"
          style={{
            padding: "16px 8px 14px",
            background: "var(--color-bg-card)",
            border: "1px dashed var(--color-border)",
          }}
        >
          <span
            className="font-display italic text-2xl leading-none"
            style={{ color: "var(--color-muted-foreground)", opacity: 0.5 }}
          >
            +{remaining}
          </span>
          <span
            className="text-[10px] text-center leading-tight"
            style={{ color: "var(--color-muted-foreground)", opacity: 0.5 }}
          >
            a conquistar
          </span>
        </div>
      )}
    </div>
  );
}
