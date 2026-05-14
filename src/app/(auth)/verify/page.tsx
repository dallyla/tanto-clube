import Link from "next/link";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="bg-bg-card border border-[color:var(--color-border)] rounded-2xl p-8 shadow-2xl text-center">
      <div className="text-5xl mb-5">✉️</div>
      <h1 className="font-display text-cream text-2xl font-semibold mb-2">
        Verifique seu email
      </h1>
      <p className="text-[color:var(--color-muted-foreground)] text-sm leading-relaxed mb-2">
        Enviamos um link de acesso para
      </p>
      {email && (
        <p className="text-gold font-semibold text-sm mb-6 break-all">{email}</p>
      )}
      <p className="text-[color:var(--color-muted-foreground)] text-sm leading-relaxed mb-8">
        Clique no link no email para entrar. Ele expira em 10 minutos.
        Confira a caixa de spam se não aparecer.
      </p>

      <Link
        href="/login"
        className="text-gold text-sm hover:text-gold-bright underline underline-offset-4 transition-colors"
      >
        Usar outro email
      </Link>
    </div>
  );
}
