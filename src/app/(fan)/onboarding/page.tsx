"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim().replace(/^@/, "");
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/lastfm/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: trimmed }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Não conseguimos verificar esse usuário. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/ranking");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎵</div>
          <h1 className="font-display text-cream text-2xl font-semibold mb-2">
            Conecte seu Last.fm
          </h1>
          <p className="text-[color:var(--color-muted-foreground)] text-sm leading-relaxed">
            O TANTO Clube conta seus plays de Diego Martins via Last.fm.
            Você precisa ter uma conta no Last.fm com scrobbling ativo.
          </p>
        </div>

        <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-beige text-sm font-medium">
                Usuário do Last.fm
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted-foreground)] text-sm select-none">
                  last.fm/user/
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="off"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  placeholder="seunome"
                  className="
                    w-full pl-[7.5rem] pr-4 py-3 rounded-xl
                    bg-[color:var(--color-input)] border border-[color:var(--color-border)]
                    text-cream placeholder:text-[color:var(--color-muted-foreground)]
                    focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent
                    transition-all text-sm
                  "
                />
              </div>
            </div>

            {error && (
              <p className="text-cherry text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="
                w-full py-3 rounded-xl font-semibold text-sm
                bg-gold text-bg-primary
                hover:bg-gold-bright
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors mt-1
              "
            >
              {loading ? "Verificando..." : "Conectar Last.fm"}
            </button>
          </form>
        </div>

        <p className="text-[color:var(--color-muted-foreground)] text-xs text-center mt-5 leading-relaxed">
          Não tem Last.fm?{" "}
          <a
            href="https://www.last.fm/join"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-bright underline underline-offset-4 transition-colors"
          >
            Crie uma conta grátis
          </a>{" "}
          e ative o scrobbling no Spotify.
        </p>
      </div>
    </div>
  );
}
