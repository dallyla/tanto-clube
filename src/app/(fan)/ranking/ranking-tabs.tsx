"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "era", label: "Era" },
  { key: "mes", label: "Mês" },
  { key: "geral", label: "Geral" },
  { key: "album", label: "Álbum" },
];

export default function RankingTabs() {
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "era";

  return (
    <div
      className="flex gap-1 p-1 rounded-xl"
      style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
    >
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/ranking?tab=${tab.key}`}
          className="flex-1 text-center py-1.5 text-sm rounded-lg transition-colors"
          style={
            active === tab.key
              ? { background: "var(--color-cherry)", color: "var(--color-cherry-fg)", fontWeight: 500 }
              : { color: "var(--color-muted-foreground)" }
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
