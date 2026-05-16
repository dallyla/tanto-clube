"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "TANTO", subtitle: "clube" },
  "/ranking": { title: "Ranking", subtitle: "queda livre" },
  "/era": { title: "Era I", subtitle: "em foco" },
  "/conquistas": { title: "Conquistas", subtitle: "suas" },
  "/profile": { title: "Perfil", subtitle: "você" },
};

interface AppHeaderProps {
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
}

export default function AppHeader({ avatarUrl, avatarEmoji }: AppHeaderProps) {
  const pathname = usePathname();
  const meta = ROUTE_META[pathname] ?? { title: "TANTO", subtitle: "clube" };

  return (
    <header
      className="sticky top-0 z-50 px-4"
      style={{
        background: "var(--color-bg-nav)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="max-w-2xl mx-auto h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-gold text-xl font-semibold">
            {meta.title}
          </span>
          <span className="font-script text-cream text-base">
            {meta.subtitle}
          </span>
        </div>

        <Link href="/profile" aria-label="Perfil">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg leading-none select-none overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--color-cherry-deep), var(--color-cherry))",
              boxShadow: "0 2px 8px rgb(196 49 75 / 0.35)",
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              avatarEmoji ?? "🎵"
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
