import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "TANTO Clube",
    template: "%s · TANTO Clube",
  },
};

export default function FanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-bg-primary/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/ranking" className="flex items-center gap-2 group">
            <span className="font-display text-gold text-xl font-semibold group-hover:text-gold-bright transition-colors">
              TANTO
            </span>
            <span className="font-script text-cream text-base">Clube</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/ranking"
              className="text-beige hover:text-cream transition-colors font-medium"
            >
              Ranking
            </Link>
            <Link
              href="/profile"
              className="text-beige hover:text-cream transition-colors font-medium"
            >
              Perfil
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-[color:var(--color-border)] py-6">
        <p className="text-center text-[color:var(--color-muted-foreground)] text-xs">
          TANTO Clube © 2026 · Fã-clube de Diego Martins
        </p>
      </footer>
    </div>
  );
}
