"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function MagicLinkVerifier() {
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const callbackURL = searchParams.get("callbackURL") ?? "/ranking";

    if (!token) {
      setError(true);
      return;
    }

    // Redirect natively — garante que o browser processa os cookies Set-Cookie do Better Auth
    window.location.href = `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent(callbackURL)}`;
  }, [searchParams]);

  if (error) {
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
        Verificando seu link
      </h1>
      <p className="text-[color:var(--color-muted-foreground)] text-sm mb-6">
        Aguarde um momento
      </p>
      <div className="w-full bg-[color:var(--color-border)] rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-gold rounded-full animate-pulse" style={{ width: "60%" }} />
      </div>
    </div>
  );
}

const Fallback = (
  <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-8 shadow-2xl text-center">
    <div className="relative w-16 h-16 mx-auto mb-6">
      <svg className="animate-spin w-16 h-16" style={{ animationDuration: "1.4s" }} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" stroke="#3a2a1a" strokeWidth="4" />
        <circle cx="32" cy="32" r="30" stroke="#c8a45c" strokeWidth="4" strokeLinecap="round" strokeDasharray="60 130" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl">🎵</span>
    </div>
    <h1 className="font-display text-cream text-xl font-semibold mb-1">Verificando seu link</h1>
    <p className="text-[color:var(--color-muted-foreground)] text-sm mb-6">Aguarde um momento</p>
    <div className="w-full bg-[color:var(--color-border)] rounded-full h-1.5 overflow-hidden">
      <div className="h-full bg-gold rounded-full" style={{ width: "20%" }} />
    </div>
  </div>
);

export default function MagicLinkPage() {
  return <Suspense fallback={Fallback}><MagicLinkVerifier /></Suspense>;
}
