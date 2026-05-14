"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "success" | "error";

export default function MagicLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const token = searchParams.get("token");
    const callbackURL = searchParams.get("callbackURL") ?? "/ranking";

    if (!token) {
      setStatus("error");
      return;
    }

    // Animate progress bar up to ~80% while waiting
    const tick = setInterval(() => {
      setProgress((p) => (p < 80 ? p + 4 : p));
    }, 120);

    fetch(
      `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent(callbackURL)}`,
      { credentials: "include" }
    )
      .then((res) => {
        clearInterval(tick);
        setProgress(100);
        setStatus("success");
        // Small delay so the user sees 100% before navigating
        setTimeout(() => {
          router.replace(res.url && res.url !== window.location.href ? res.url : callbackURL);
        }, 400);
      })
      .catch(() => {
        clearInterval(tick);
        setStatus("error");
      });

    return () => clearInterval(tick);
  }, [router, searchParams]);

  if (status === "error") {
    return (
      <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-8 shadow-2xl text-center">
        <div className="text-5xl mb-5">⚠️</div>
        <h1 className="font-display text-cream text-xl font-semibold mb-2">
          Link inválido ou expirado
        </h1>
        <p className="text-[color:var(--color-muted-foreground)] text-sm leading-relaxed mb-6">
          O link pode ter expirado (válido por 10 minutos) ou já foi usado.
        </p>
        <Link
          href="/login"
          className="inline-block bg-crimson text-cream text-sm font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-8 shadow-2xl text-center">
      <div className="mb-6">
        {/* Vinyl record spinner */}
        <div className="relative w-16 h-16 mx-auto">
          <svg
            className="animate-spin w-16 h-16"
            style={{ animationDuration: "1.4s" }}
            viewBox="0 0 64 64"
            fill="none"
          >
            <circle cx="32" cy="32" r="30" stroke="#3a2a1a" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r="30"
              stroke="#c8a45c"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="60 130"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl">
            🎵
          </span>
        </div>
      </div>

      <h1 className="font-display text-cream text-xl font-semibold mb-1">
        {status === "success" ? "Entrando…" : "Verificando seu link"}
      </h1>
      <p className="text-[color:var(--color-muted-foreground)] text-sm mb-6">
        {status === "success" ? "Redirecionando…" : "Aguarde um momento"}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-[color:var(--color-border)] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
