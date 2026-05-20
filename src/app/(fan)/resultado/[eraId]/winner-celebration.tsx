"use client";

import { useState, useEffect, useRef } from "react";
import { AddressForm } from "./address-form";

type Prize = {
  prizeAwardId: string;
  prizeName: string;
  prizeType: string;
  isPhysical: boolean;
  status: string;
};

type Props = {
  rank: number;
  eraName: string;
  eraEmoji: string;
  prizes: Prize[];
};

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#c8a45c", "#e0bc70", "#c4314b", "#f4ead5", "#8b6f3a"];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.15,
    }));

    let frame: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        if (p.y < canvas.height + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1001 }}
    />
  );
}

export function WinnerCelebration({ rank, eraName, eraEmoji, prizes }: Props) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<"celebrate" | "address">("celebrate");
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  const physicalPendingPrizes = prizes.filter((p) => p.isPhysical && p.status === "address_pending");
  const MEDALS = ["🥇", "🥈", "🥉"];
  const medal = MEDALS[rank - 1] ?? "🏅";

  if (!open) return null;

  return (
    <>
      <style>{`
        .modal-scroll::-webkit-scrollbar { width: 5px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(200,164,92,0.35);
          border-radius: 99px;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(200,164,92,0.6);
        }
        .modal-scroll { scrollbar-width: thin; scrollbar-color: rgba(200,164,92,0.35) transparent; }
      `}</style>
      <Confetti />
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "16px",
        }}
      >
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid rgba(200,164,92,0.5)",
            borderRadius: "20px",
            maxWidth: "440px",
            width: "100%",
            maxHeight: "calc(100dvh - 32px)",
            overflow: "hidden",
            textAlign: "center",
            position: "relative",
            boxShadow: "0 0 60px rgba(200,164,92,0.15)",
          }}
        >
        <div
          className="modal-scroll"
          style={{
            padding: step === "address" ? "24px 20px" : "36px 28px",
            maxHeight: "calc(100dvh - 32px)",
            overflowY: "auto",
          }}
        >
          {step === "celebrate" ? (
            <>
              <div style={{ fontSize: "4rem", marginBottom: "8px" }}>{medal}</div>
              <p
                style={{
                  fontFamily: "var(--font-display, serif)",
                  fontSize: "13px",
                  fontStyle: "italic",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--color-gold)",
                  marginBottom: "8px",
                }}
              >
                {eraEmoji} {eraName}
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-display, serif)",
                  fontSize: "28px",
                  fontStyle: "italic",
                  fontWeight: 500,
                  color: "var(--color-cream)",
                  lineHeight: 1.2,
                  marginBottom: "8px",
                }}
              >
                #{rank} — você ficou entre os melhores!
              </h2>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px", marginBottom: "24px" }}>
                Parabéns pelo desempenho nesta era.
              </p>

              <div
                style={{
                  background: "rgba(200,164,92,0.08)",
                  border: "1px solid rgba(200,164,92,0.25)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--color-gold)",
                    marginBottom: "10px",
                  }}
                >
                  🎁 seus prêmios
                </p>
                {prizes.length > 0 ? prizes.map((p) => (
                  <div
                    key={p.prizeAwardId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>
                      {p.isPhysical ? "📦" : "✨"}
                    </span>
                    <p style={{ color: "var(--color-cream)", fontSize: "14px", fontWeight: 500 }}>
                      {p.prizeName}
                    </p>
                  </div>
                )) : (
                  <p style={{ color: "var(--color-muted-foreground)", fontSize: "13px" }}>
                    Seus prêmios serão confirmados em breve pela administração.
                  </p>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {physicalPendingPrizes.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedPrize(physicalPendingPrizes[0]);
                      setStep("address");
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: "var(--color-gold)",
                      border: "none",
                      color: "var(--color-bg-primary)",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    📦 Informar endereço de entrega
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted-foreground)",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Ver o ranking completo
                </button>
              </div>
            </>
          ) : selectedPrize ? (
            <AddressForm
              prizeAwardId={selectedPrize.prizeAwardId}
              prizeName={selectedPrize.prizeName}
              onSuccess={() => setOpen(false)}
              onBack={() => setStep("celebrate")}
            />
          ) : null}
        </div>
        </div>
      </div>
    </>
  );
}
