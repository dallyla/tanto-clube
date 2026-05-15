"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", icon: "🏠", href: "/" },
  { label: "Ranking", icon: "🏆", href: "/ranking" },
  { label: "Era", icon: "🎯", href: null },
  { label: "Prêmios", icon: "🏅", href: null },
  { label: "Perfil", icon: "👤", href: "/profile" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 px-1"
      style={{
        background: "var(--color-bg-nav)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {NAV_ITEMS.map(({ label, icon, href }) => {
        const isActive = href !== null && pathname === href;
        const disabled = href === null;

        const inner = (
          <span
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              isActive
                ? "text-gold"
                : disabled
                ? "text-[color:var(--color-muted-foreground)] opacity-40"
                : "text-[color:var(--color-muted-foreground)] hover:text-beige"
            }`}
          >
            <span className={`text-xl leading-none ${isActive ? "scale-110" : ""} transition-transform`}>
              {icon}
            </span>
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </span>
        );

        if (disabled) return <span key={label} aria-disabled="true">{inner}</span>;
        return (
          <Link key={label} href={href!}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
