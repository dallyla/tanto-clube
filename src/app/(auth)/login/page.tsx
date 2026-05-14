"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const result = await signIn.magicLink({
      email: email.trim().toLowerCase(),
      callbackURL: "/onboarding",
    });

    if (result.error) {
      setError("Não foi possível enviar o link. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/verify?email=" + encodeURIComponent(email.trim()));
  }

  return (
    <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-8 shadow-2xl">
      <h1 className="font-display text-cream text-2xl font-semibold mb-2 text-center">
        Entrar no clube
      </h1>
      <p className="text-[color:var(--color-muted-foreground)] text-sm text-center mb-8 leading-relaxed">
        Enviamos um link mágico pro seu email — sem senha, sem frescura.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-beige text-sm font-medium">
            Seu email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="
              w-full px-4 py-3 rounded-xl
              bg-[color:var(--color-input)] border border-[color:var(--color-border)]
              text-cream placeholder:text-[color:var(--color-muted-foreground)]
              focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent
              transition-all text-sm
            "
          />
        </div>

        {error && (
          <p className="text-cherry text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="
            w-full py-3 rounded-xl font-semibold text-sm
            bg-gold text-bg-primary
            hover:bg-gold-bright
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors mt-2
          "
        >
          {loading ? "Enviando..." : "Receber link de acesso"}
        </button>
      </form>

      <p className="text-[color:var(--color-muted-foreground)] text-xs text-center mt-6 leading-relaxed">
        Ao entrar, você concorda com as regras do clube e com o uso do Last.fm para contagem de plays.
      </p>
    </div>
  );
}
