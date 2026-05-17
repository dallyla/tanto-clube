"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_SECTIONS = [
  {
    label: "visão",
    items: [{ href: "/admin", label: "Dashboard", icon: "📊" }],
  },
  {
    label: "gestão",
    items: [
      { href: "/admin/eras", label: "Eras & Desafios", icon: "🎯" },
      { href: "/admin/missions", label: "Missões", icon: "🎁" },
      { href: "/admin/badges", label: "Badges", icon: "🏅" },
    ],
  },
  {
    label: "comunidade",
    items: [
      { href: "/admin/users", label: "Fãs", icon: "👥" },
      { href: "/admin/rankings", label: "Apuração", icon: "🏆" },
      { href: "/admin/shipments", label: "Envio", icon: "📦" },
    ],
  },
  {
    label: "análise",
    items: [
      { href: "/admin/audit", label: "Relatórios", icon: "📈" },
      { href: "/admin/prizes", label: "Prêmios", icon: "🎁" },
    ],
  },
];

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("admin-theme") as "dark" | "light" | null;
    const initial = stored ?? "dark";
    setTheme(initial);
    if (initial === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  function apply(t: "dark" | "light") {
    setTheme(t);
    localStorage.setItem("admin-theme", t);
    if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-strong)",
        borderRadius: "999px",
        padding: "4px",
      }}
    >
      {(["dark", "light"] as const).map((t) => (
        <button
          key={t}
          onClick={() => apply(t)}
          style={{
            background:
              theme === t
                ? "linear-gradient(135deg, var(--color-cherry-deep), var(--color-cherry))"
                : "transparent",
            border: "none",
            color: theme === t ? "var(--color-cream)" : "var(--color-muted-foreground)",
            fontSize: "11px",
            fontWeight: 500,
            padding: "5px 12px",
            borderRadius: "999px",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
        >
          {t === "dark" ? "escuro" : "claro"}
        </button>
      ))}
    </div>
  );
}

export function AdminSidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "240px",
        minWidth: "240px",
        background: "var(--color-bg-sidebar)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <span
          className="font-display"
          style={{
            color: "var(--color-gold)",
            fontSize: "24px",
            fontWeight: 600,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
            display: "block",
            lineHeight: 1,
          }}
        >
          TANTO
        </span>
        <span
          className="font-script"
          style={{
            color: "var(--color-muted-foreground)",
            fontSize: "17px",
            display: "block",
            marginTop: "-2px",
          }}
        >
          clube · admin
        </span>
        <div
          style={{
            display: "inline-block",
            marginTop: "10px",
            padding: "3px 8px",
            borderRadius: "4px",
            background: "rgba(196, 49, 75, 0.15)",
            border: "1px solid rgba(196, 49, 75, 0.35)",
            color: "var(--color-cherry)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          administrador
        </div>
        <p
          style={{
            marginTop: "8px",
            fontSize: "12px",
            color: "var(--color-muted-foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingBottom: "8px" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p
              className="font-display"
              style={{
                fontSize: "11px",
                fontStyle: "italic",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-gold-deep)",
                padding: "12px 20px 6px",
                fontWeight: 500,
              }}
            >
              {section.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {section.items.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 20px",
                      fontSize: "13.5px",
                      fontWeight: 500,
                      textDecoration: "none",
                      color: isActive
                        ? "var(--color-gold)"
                        : "var(--color-muted-foreground)",
                      background: isActive
                        ? "var(--color-bg-card-hover)"
                        : "transparent",
                      borderLeft: `2px solid ${isActive ? "var(--color-gold)" : "transparent"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{ fontSize: "15px", width: "18px", textAlign: "center" }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <ThemeToggle />
        <Link
          href="/"
          style={{
            fontSize: "12px",
            color: "var(--color-muted-foreground)",
            textDecoration: "none",
          }}
        >
          ← Voltar ao app
        </Link>
      </div>
    </aside>
  );
}
